import { describe, expect, it } from "vitest";

import { generateCard, type CallModel, type ModelRequest } from "../ai";
import { CardContentSchema, photoFit, FRAME_ASPECT, type CardContent } from "../cards";
import { normalizeNumbers, numbersIn, quoteInSource, stripUnverified, supportedNumber, verifyCard } from "../factcheck";
import type { SourceText } from "../research";

const card = (patch: Partial<CardContent>): CardContent =>
  CardContentSchema.parse({ layout: "stats", icon: "", title: "Real Madrid", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", ...patch });

const WIKI =
  "Ronaldo joined Real Madrid in 2009. At Real Madrid he scored 450 goals in 438 appearances and won four Champions League titles. " +
  "He won the Ballon d'Or four times while at the club. ".repeat(3);
const NEWS = "Cristiano Ronaldo left Madrid as the club's all-time top scorer with 450 goals in all competitions, winning four Champions League titles.";

const texts: SourceText[] = [
  { title: "Cristiano Ronaldo", text: WIKI, group: "wikipedia" },
  { title: "espn.com", text: NEWS, group: "espn.com" },
];

describe("number checks", () => {
  it("reads numbers in any form and skips placeholders and step labels", () => {
    expect(normalizeNumbers("Four titles, 1,000 goals, 3rd place")).toBe("4 titles, 1000 goals, 3 place");
    expect(numbersIn("Step 2: grow [monthly revenue] to 450 by 2027")).toEqual(["450", "2027"]);
    expect(numbersIn("First era of dominance, 1,000 goals")).toEqual(["1000"]);
  });

  it("needs the number near words that say what it counts", () => {
    const src = normalizeNumbers(WIKI);
    expect(supportedNumber("438", "appearances for Real Madrid", src)).toBe(true);
    expect(supportedNumber("438", "Ballon d'Or awards", normalizeNumbers("He won 438 matches. ".padEnd(900, "x") + " Ballon d'Or"))).toBe(false);
  });

  it("accepts numbers that two independent sources agree on", () => {
    const ok = card({ stats: [{ value: "450", label: "goals for Real Madrid" }, { value: "4", label: "Champions League titles" }] });
    expect(verifyCard(ok, texts, "")).toEqual([]);
  });

  it("rejects a number only one source has, and one no source has", () => {
    const onlyWiki = card({ stats: [{ value: "438", label: "appearances for Real Madrid" }] });
    expect(verifyCard(onlyWiki, texts, "")[0].detail).toContain("only one source");
    const invented = card({ stats: [{ value: "900+", label: "career goals" }] });
    expect(verifyCard(invented, texts, "")[0].detail).toContain("isn't in the sources");
  });

  it("trusts figures the user gave, and needs one source when there is only one", () => {
    const own = card({ stats: [{ value: "12%", label: "monthly growth" }] });
    expect(verifyCard(own, [], "We grow 12% a month")).toEqual([]);
    expect(verifyCard(card({ stats: [{ value: "438", label: "appearances" }] }), [texts[0]], "")).toEqual([]);
  });

  it("checks quotes word for word", () => {
    expect(quoteInSource("Your love makes me strong", "fans say your love makes me strong, he said")).toBe(true);
    const q = card({ layout: "quote", quote: "I am the best player in history, without any doubt at all", quoteAuthor: "Ronaldo" });
    expect(verifyCard(q, texts, "")[0].field).toBe("quote");
  });

  it("only accepts a quote the sources show the person saying", () => {
    const lead =
      "Cristiano Ronaldo dos Santos Aveiro is a Portuguese professional footballer who plays as a forward for and captains the Saudi Pro League club Al-Nassr.";
    const said = 'After the final, Ronaldo told reporters: "Your love makes me stronger and I will never stop fighting for this shirt."';
    const src: SourceText[] = [{ title: "Cristiano Ronaldo", text: `${lead} ${said}`, group: "wikipedia" }];
    // An encyclopedia sentence is not something Ronaldo said.
    const fake = card({ layout: "quote", quote: lead, quoteAuthor: "Cristiano Ronaldo" });
    expect(verifyCard(fake, src, "")[0].detail).toContain("not something");
    const real = card({ layout: "quote", quote: "Your love makes me stronger and I will never stop fighting for this shirt.", quoteAuthor: "Cristiano Ronaldo" });
    expect(verifyCard(real, src, "")).toEqual([]);
    // The right words with the wrong person are rejected too.
    expect(verifyCard({ ...real, quoteAuthor: "Lionel Messi" }, src, "")[0].field).toBe("quote");
  });

  it("drops what can't be confirmed and falls back to a simpler layout", () => {
    const c = card({ stats: [{ value: "900+", label: "goals" }], subtitle: "A record 900 goals." });
    const stripped = stripUnverified(c, verifyCard(c, texts, ""), "Real Madrid");
    expect(stripped.layout).toBe("section");
    expect(JSON.stringify(stripped)).not.toContain("900");
  });
});

describe("generateCard fact checking", () => {
  it("rewrites a card the checker rejects, then removes what still fails", async () => {
    const drafts = [
      { stats: [{ value: "900+", label: "career goals" }, { value: "450", label: "goals for Real Madrid" }] },
      { stats: [{ value: "901", label: "career goals" }, { value: "450", label: "goals for Real Madrid" }] },
    ];
    const requests: ModelRequest<unknown>[] = [];
    const call = (async (request: ModelRequest<unknown>) => {
      requests.push(request);
      if (request.role === "check") return { problems: [] };
      const d = drafts[requests.filter((r) => r.role === "card").length - 1];
      return { layout: "stats", eyebrow: "", icon: "⚽", title: "Goals", subtitle: "", items: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: "", ...d };
    }) as CallModel;
    // Stand-in research: the Wikipedia text is passed as a stored web page so nothing is fetched.
    const research = { sources: [{ title: "t", url: "https://espn.com/x", kind: "web" as const }], webTexts: [{ title: "espn.com", text: NEWS }, { title: "bbc.com", text: WIKI }] };
    const { card: result } = await generateCard(
      { deckTitle: "Ronaldo", prompt: "Ronaldo at Real Madrid", outline: [{ title: "Cover", points: [] }, { title: "Goals", points: [] }], index: 1, mode: "quick", research, factCheck: true },
      call,
    );
    const cardCalls = requests.filter((r) => r.role === "card");
    expect(cardCalls).toHaveLength(2);
    expect(cardCalls[1].user).toContain("fact-checker rejected");
    expect(result.stats).toEqual([{ value: "450", label: "goals for Real Madrid" }]);
  });
});

describe("photoFit", () => {
  it("shows a tall photo whole on a wide slide but crops a wide photo's sides", () => {
    expect(photoFit(0.75, FRAME_ASPECT.fullBleed).mode).toBe("contain");
    expect(photoFit(1.5, FRAME_ASPECT.split).mode).toBe("cover");
    expect(photoFit(1.6, FRAME_ASPECT.fullBleed)).toEqual({ mode: "cover", focusY: 25 });
  });
});
