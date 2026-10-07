import { describe, expect, it } from "vitest";

import { generateCard, generateOutline, type CallModel, type ModelRequest } from "../ai";
import { MAX_FILES, MAX_MATERIAL_CHARS, materialResearch, parseMaterial, spreadExcerpt, tidyText } from "../material";
import { decodeXml, tableChunks, xmlParagraphs } from "../read-file";
import { mergeResearch, relevantExcerpt } from "../research";

const report = [
  "Quarterly report",
  "Online sales reached 48,210 orders in the third quarter, up from 39,877 in the second quarter, led by the new subscription box.",
  "The Milan shop closed for two weeks in August for a refit, which cut walk-in revenue but doubled click-and-collect orders afterwards.",
].join("\n\n");

describe("tidyText", () => {
  it("keeps short headings with the paragraph after them", () => {
    const lines = tidyText(report).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^Quarterly report · Online sales/);
  });

  it("splits very long paragraphs at sentences", () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} says something useful about the topic.`).join(" ");
    const parts = tidyText(long).split("\n");
    expect(parts.length).toBeGreaterThan(2);
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThanOrEqual(1050);
  });
});

describe("parseMaterial", () => {
  it("accepts only well-formed files, up to the limits", () => {
    const many = Array.from({ length: MAX_FILES + 3 }, (_, i) => ({ name: `f${i}.txt`, text: report }));
    expect(parseMaterial(many)).toHaveLength(MAX_FILES);
    expect(parseMaterial([{ name: 1, text: "x" }, "nope", { name: "a.txt", text: "too short" }])).toEqual([]);
    expect(parseMaterial("not a list")).toEqual([]);
  });

  it("caps the total text and keeps same-named files apart", () => {
    const big = "A long paragraph about sales numbers in many regions of the country. ".repeat(600);
    const list = parseMaterial([{ name: "a.txt", text: big }, { name: "a.txt", text: big }, { name: "a.txt", text: big }]);
    expect(list.reduce((n, m) => n + m.text.length, 0)).toBeLessThanOrEqual(MAX_MATERIAL_CHARS);
    expect(new Set(list.map((m) => m.name)).size).toBe(list.length);
  });
});

describe("material as research", () => {
  it("survives merging with web results and leads matching excerpts", () => {
    const files = materialResearch([{ name: "q3.pdf", text: tidyText(report) }]);
    const web = {
      sources: [{ title: "News", url: "https://example.com/a", kind: "web" as const }],
      webTexts: [{ title: "example.com", text: "Online sales across Europe grew in the third quarter according to analysts and retailers." }],
    };
    const merged = mergeResearch(files, web);
    expect(merged.sources.map((s) => s.kind)).toEqual(["file", "web"]);
    const excerpt = relevantExcerpt(merged.webTexts.map((t) => ({ ...t, group: t.title })), "online sales third quarter", 200);
    expect(excerpt).toContain("[file:q3.pdf]");
  });

  it("spreads a planning excerpt across the whole file", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Paragraph ${i} of the handbook with enough words to count.`).join("\n");
    const excerpt = spreadExcerpt([{ title: "file:h.docx", text }], 800);
    expect(excerpt.length).toBeLessThanOrEqual(800);
    expect(excerpt).toContain("Paragraph 0 ");
    expect(excerpt).toMatch(/Paragraph 4\d /);
  });
});

function recorder(outputs: (request: ModelRequest<unknown>) => unknown) {
  const requests: ModelRequest<unknown>[] = [];
  const call = (async (request: ModelRequest<unknown>) => {
    requests.push(request);
    return outputs(request);
  }) as CallModel;
  return { call, requests };
}

describe("decks from files", () => {
  it("plans the outline from the attached material and keeps it as a source", async () => {
    const { call, requests } = recorder((r) =>
      r.role === "research" ? { factual: false, searches: [] } : { title: "Q3", cards: [{ title: "Q3", points: [] }, { title: "Sales", points: [] }] },
    );
    const result = await generateOutline("A presentation based on q3.pdf", 2, call, { material: [{ name: "q3.pdf", text: tidyText(report) }] });
    const outline = requests.find((r) => r.role === "outline")!;
    expect(outline.context).toContain("48,210 orders");
    expect(outline.instructions).toContain("The user attached files");
    expect(result.research.sources).toEqual([{ title: "q3.pdf", url: "file:q3.pdf", kind: "file" }]);
  });

  it("uses figures from the user's own files without a second source", async () => {
    const card = {
      layout: "stats",
      icon: "📈",
      eyebrow: "",
      title: "Sales *up*",
      subtitle: "",
      items: [],
      stats: [{ value: "48,210", label: "orders in Q3" }],
      table: { columns: [], rows: [] },
      quote: "",
      quoteAuthor: "",
      imageQuery: "",
    };
    const { call } = recorder((r) => (r.role === "check" ? { problems: [] } : card));
    const research = materialResearch([{ name: "q3.pdf", text: tidyText(report) }]);
    const result = await generateCard(
      { deckTitle: "Q3", prompt: "brief", outline: [{ title: "Q3", points: [] }, { title: "Sales", points: [] }], index: 1, mode: "standard", research, factCheck: true },
      call,
    );
    expect(result.card.stats[0].value).toBe("48,210");
    expect(result.found).toBeUndefined();
  });
});

describe("office file text", () => {
  it("reads paragraphs, tabs and entities from Word XML", () => {
    const xml =
      '<w:body><w:p><w:r><w:t>Fish &amp; chips</w:t></w:r><w:r><w:tab/><w:t xml:space="preserve"> cost £9</w:t></w:r></w:p>' +
      "<w:p><w:r><w:t>Second line</w:t></w:r></w:p><w:p></w:p></w:body>";
    expect(xmlParagraphs(xml, "w")).toEqual(["Fish & chips cost £9", "Second line"]);
  });

  it("reads slide text from DrawingML", () => {
    const xml = "<a:p><a:r><a:t>Title</a:t></a:r></a:p><a:p><a:r><a:t>Point &#8364;5</a:t></a:r></a:p>";
    expect(xmlParagraphs(xml, "a")).toEqual(["Title", "Point €5"]);
  });

  it("decodes XML entities", () => {
    expect(decodeXml("&lt;b&gt; &quot;x&quot; &#x41;&#66;")).toBe('<b> "x" AB');
  });

  it("keeps table headers with every chunk of rows", () => {
    const rows = ["Year | Sales", ...Array.from({ length: 30 }, (_, i) => `${2000 + i} | ${i * 10}`)];
    const chunks = tableChunks("Sheet 1", rows);
    expect(chunks).toHaveLength(3);
    expect(chunks.every((c) => c.includes("Columns: Year | Sales"))).toBe(true);
  });
});
