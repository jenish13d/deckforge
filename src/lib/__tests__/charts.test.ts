import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { chartNumber, formatChartValue, normalizeCard, type CardContent } from "../cards";
import { stripUnverified, verifyCard } from "../factcheck";
import { planDeck } from "../plan";
import { webSearch, type SourceText } from "../research";

const base = { icon: "", title: "Fluoride in toothpaste", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] } };

describe("chart cards", () => {
  it("read values the model writes as text", () => {
    expect(chartNumber("72%")).toBe(72);
    expect(chartNumber("1,450 ppm")).toBe(1450);
    expect(chartNumber(0.7)).toBe(0.7);
    expect(Number.isNaN(chartNumber("about half"))).toBe(true);
    expect(formatChartValue(1450, "ppm")).toBe("1,450 ppm");
    expect(formatChartValue(72, "%")).toBe("72%");
  });

  it("keep 3-8 valid points, and show fewer as big numbers", () => {
    const chart = normalizeCard({ ...base, layout: "chart", chart: { kind: "LINE", unit: "%", points: [{ label: "2000", value: "31%" }, { label: "2010", value: 27 }, { label: "2020", value: "22" }, { label: "bad", value: "n/a" }] } });
    expect(chart.layout).toBe("chart");
    expect(chart.chart).toEqual({ kind: "line", unit: "%", points: [{ label: "2000", value: 31 }, { label: "2010", value: 27 }, { label: "2020", value: 22 }] });

    const thin = normalizeCard({ ...base, layout: "chart", chart: { kind: "bar", unit: "ppm", points: [{ label: "Adult paste", value: 1450 }] } });
    expect(thin.layout).toBe("stats");
    expect(thin.stats).toEqual([{ value: "1,450 ppm", label: "Adult paste" }]);
    expect(thin.chart).toBeUndefined();

    expect(normalizeCard({ ...base, layout: "chart" }).layout).toBe("bullets");
    // Other layouts never carry a chart.
    expect(normalizeCard({ ...base, layout: "bullets", chart: { kind: "bar", unit: "", points: [{ label: "a", value: 1 }, { label: "b", value: 2 }, { label: "c", value: 3 }] } }).chart).toBeUndefined();
  });

  it("have every value checked, and fall back to big numbers when too few are confirmed", () => {
    const texts: SourceText[] = [
      { title: "a.org", text: "Adult toothpaste contains 1450 ppm fluoride. Children's toothpaste contains 1000 ppm fluoride.", group: "a.org" },
    ];
    const card: CardContent = normalizeCard({
      ...base,
      layout: "chart",
      chart: { kind: "bar", unit: "ppm", points: [{ label: "Adult toothpaste", value: 1450 }, { label: "Children's toothpaste", value: 1000 }, { label: "Varnish", value: 22600 }] },
    });
    const problems = verifyCard(card, texts, "");
    expect(problems.map((p) => p.field)).toEqual(["chart.2"]);
    const out = stripUnverified(card, problems, card.title);
    expect(out.layout).toBe("stats");
    expect(out.stats).toEqual([
      { value: "1,450 ppm", label: "Adult toothpaste" },
      { value: "1,000 ppm", label: "Children's toothpaste" },
    ]);
    expect(JSON.stringify(out)).not.toContain("22600");
  });

  it("are planned only for decks with sources", () => {
    const cards = [{ title: "Cover", points: [] }, { title: "Trend", points: ["a", "b", "c"], layout: "chart" }, { title: "End", points: ["x", "y"] }];
    expect(planDeck(cards, { style: "auto", grounded: true })[1].layout).toBe("chart");
    expect(planDeck(cards, { style: "auto", grounded: false })[1].layout).not.toBe("chart");
  });
});

describe("web search", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const page = (url: string) => ({ title: "Page", url, snippet: "Fluoride strengthens enamel. ".repeat(20) });

  it("uses Perplexity first, without social media or Wikipedia copies", async () => {
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-test");
    vi.stubEnv("TAVILY_API_KEY", "tvly-test");
    const fetch = vi.fn(async (url: string) =>
      Response.json(url.includes("perplexity") ? { results: [page("https://www.who.int/a"), page("https://reddit.com/r/x"), page("https://www.ada.org/b")], id: "1" } : { results: [] }),
    );
    vi.stubGlobal("fetch", fetch);
    const found = await webSearch("fluoride toothpaste");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toBe("https://api.perplexity.ai/search");
    expect(found.webTexts.map((t) => t.title)).toEqual(["who.int", "ada.org"]);
  });

  it("falls back to Tavily when Perplexity fails or isn't set up", async () => {
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-test");
    vi.stubEnv("TAVILY_API_KEY", "tvly-test");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetch = vi.fn(async (url: string) =>
      url.includes("perplexity") ? new Response("busy", { status: 503 }) : Response.json({ results: [{ title: "T", url: "https://www.nhs.uk/c", raw_content: "Brush twice a day. ".repeat(40) }] }),
    );
    vi.stubGlobal("fetch", fetch);
    expect((await webSearch("fluoride")).webTexts.map((t) => t.title)).toEqual(["nhs.uk"]);
    log.mockRestore();
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    fetch.mockClear();
    await webSearch("fluoride");
    expect(fetch.mock.calls.map((c) => String(c[0]))).toEqual(["https://api.tavily.com/search"]);
  });
});
