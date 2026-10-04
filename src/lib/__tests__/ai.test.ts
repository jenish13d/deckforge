import { describe, expect, it } from "vitest";

import { GenerationError, deckContext, generateCard, generateOutline, type CallModel, type ModelRequest } from "../ai";

function fakeModel(output: unknown) {
  const requests: ModelRequest<unknown>[] = [];
  const call = (async (request: ModelRequest<unknown>) => {
    requests.push(request);
    return output;
  }) as CallModel;
  return { call, requests };
}

const outline = [
  { title: "Welcome", points: ["Who we are"] },
  { title: "The problem", points: ["Meal prep takes hours"] },
  { title: "Next steps", points: [] },
];

describe("generateOutline", () => {
  it("asks for the requested number of cards and normalizes the result", async () => {
    const { call, requests } = fakeModel({
      title: "Meal prep",
      cards: [...outline, { title: "Extra", points: [] }],
    });
    const result = await generateOutline("Pitch deck for meal prep", 3, call);
    expect(result.cards).toHaveLength(3);
    expect(requests[0].user).toContain("exactly 3 cards");
    expect(requests[0].user).toContain("Pitch deck for meal prep");
  });

  it("fails when no usable cards come back", async () => {
    const { call } = fakeModel({ title: "x", cards: [{ title: "", points: [] }] });
    await expect(generateOutline("x", 3, call)).rejects.toBeInstanceOf(GenerationError);
  });
});

describe("generateCard", () => {
  const card = {
    layout: "bullets",
    icon: "🥗",
    title: "The problem",
    subtitle: "",
    items: [{ heading: "Time", text: "Cooking takes hours." }],
    stats: [],
    quote: "",
    quoteAuthor: "",
  };

  it("sends the shared deck context separately from the per-card request", async () => {
    const { call, requests } = fakeModel(card);
    const result = await generateCard({ deckTitle: "Meal prep", prompt: "brief", outline, index: 1 }, call);
    expect(result.title).toBe("The problem");
    expect(requests[0].context).toBe(deckContext("Meal prep", "brief", outline));
    expect(requests[0].user).toContain('card 2 of 3: "The problem"');
    expect(requests[0].user).not.toContain("first card");
  });

  it("asks for a title layout on the first card and passes extra instructions", async () => {
    const { call, requests } = fakeModel(card);
    await generateCard({ deckTitle: "Meal prep", prompt: "brief", outline, index: 0, extra: "shorter" }, call);
    expect(requests[0].user).toContain('"title" layout');
    expect(requests[0].user).toContain("Also: shorter");
  });

  it("uses identical instructions for every card so they can be cached", async () => {
    const { call, requests } = fakeModel(card);
    await generateCard({ deckTitle: "d", prompt: "p", outline, index: 0 }, call);
    await generateCard({ deckTitle: "d", prompt: "p", outline, index: 2 }, call);
    expect(requests[0].instructions).toBe(requests[1].instructions);
    expect(requests[0].context).toBe(requests[1].context);
  });
});
