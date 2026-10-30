import { afterEach, describe, expect, it, vi } from "vitest";

import { aboutSubject, generateCard, type CallModel, type ModelRequest } from "../ai";
import { independentSources, mergeResearch, paperSearch } from "../research";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
const ABSTRACT = "Dental caries is a biofilm-mediated, sugar-driven, multifactorial disease that results in the phasic demineralisation and remineralisation of dental hard tissues. ".repeat(4);

describe("deep research", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads review papers through their abstracts, one independent source each", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("europepmc");
      expect(new URL(url).searchParams.get("query")).toContain("TITLE:(dental caries)");
      return json({
        resultList: {
          result: [
            { title: "Dental caries.", abstractText: `<h4>Abstract</h4>${ABSTRACT}`, pubYear: "2017", doi: "10.1038/nrdp.2017.30", authorString: "Pitts NB", journalInfo: { journal: { title: "Nat Rev Dis Primers" } } },
            { title: "Too short", abstractText: "Short.", pubYear: "2018", doi: "10.1/x" },
            { title: "Global epidemiology of dental caries", abstractText: ABSTRACT, pubYear: "2017", pmid: "28266116" },
          ],
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const found = await paperSearch("dental caries");
    expect(found.sources).toEqual([
      { title: "Dental caries", url: "https://doi.org/10.1038/nrdp.2017.30", kind: "paper" },
      { title: "Global epidemiology of dental caries", url: "https://europepmc.org/article/MED/28266116", kind: "paper" },
    ]);
    expect(found.webTexts[0].text).toContain("Nat Rev Dis Primers (2017)");
    expect(found.webTexts[0].text).not.toContain("<h4>");
    const merged = mergeResearch(found);
    expect(merged.sources).toHaveLength(2);
    expect(independentSources(merged.sources)).toBe(2);
  });

  it("never fails a deck when the paper service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 500 })));
    expect(await paperSearch("dental caries")).toEqual({ sources: [], webTexts: [] });
  });

  it("checks that an article found for a slide is about the deck's subject", () => {
    expect(aboutSubject("Dental caries, also known as tooth decay, is the breakdown of teeth due to acids.", "Dental caries")).toBe(true);
    expect(aboutSubject("An acid attack is a form of violent assault.", "Dental caries")).toBe(false);
  });

  it("each slide reads the Wikipedia article on its own subject", async () => {
    const fluoride = "Water fluoridation is the controlled adjustment of fluoride to a public water supply to reduce dental caries. ".repeat(8);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("list=search")) return json({ query: { search: [{ title: "Water fluoridation" }] } });
        if (url.includes("/page/html/Water_fluoridation")) return new Response(`<p>${fluoride}</p>`);
        return new Response("offline", { status: 503 });
      }),
    );
    const requests: ModelRequest<unknown>[] = [];
    const call = (async (request: ModelRequest<unknown>) => {
      requests.push(request);
      return { layout: "bullets", eyebrow: "", icon: "", title: "Fluoride", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: "" };
    }) as CallModel;
    const research = { sources: [{ title: "x", url: "https://who.int/caries", kind: "web" as const }], webTexts: [{ title: "who.int", text: "Dental caries is common. ".repeat(10) }] };
    const { found } = await generateCard(
      { deckTitle: "Dental caries", prompt: "Dental caries", outline: [{ title: "Cover", points: [] }, { title: "Fluoride in water", points: [] }], index: 1, mode: "quick", research, factCheck: false },
      call,
    );
    expect(found?.sources).toContainEqual({ title: "Water fluoridation", url: "https://en.wikipedia.org/wiki/Water_fluoridation", kind: "wikipedia" });
    expect(requests.find((r) => r.role === "card")?.user).toContain("controlled adjustment of fluoride");
  });
});

describe("speaker notes", () => {
  it("are kept through normalising and lose only the sentences the sources don't support", async () => {
    const { normalizeCard } = await import("../cards");
    const { stripUnverified, verifyCard } = await import("../factcheck");
    const card = normalizeCard({
      layout: "bullets", icon: "", title: "Sugar and acid", subtitle: "", items: [{ heading: "Acid", text: "Bacteria turn sugar into acid." }, { heading: "Enamel", text: "Acid dissolves enamel." }],
      stats: [], quote: "", quoteAuthor: "",
      notes: "Bacteria in plaque feed on sugar and release acid. About 2.3 billion people have caries in their permanent teeth. Cutting sugar lowers the risk.",
    });
    expect(card.notes).toContain("Cutting sugar");
    const sources = [{ title: "who.int", text: "Bacteria turn sugar into acid that dissolves enamel. Cutting sugar lowers the risk of caries." }];
    const problems = verifyCard(card, sources, "");
    expect(problems.some((p) => p.field === "notes")).toBe(true);
    const fixed = stripUnverified(card, problems, "Sugar and acid");
    expect(fixed.notes).toBe("Bacteria in plaque feed on sugar and release acid. Cutting sugar lowers the risk.");
  });
});
