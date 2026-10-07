import type { CallModel, ModelRequest } from "./ai";
import { AssistSchema, OutlineSchema, SetupSchema, type GeneratedCard, type Outline } from "./cards";

// Stand-in for the model when DEMO_AI=1: realistic-looking sample content so
// the whole app can be tried and shown without an API key or any cost.

export const demoEnabled = () => process.env.DEMO_AI === "1";

const SECTIONS = [
  "Why this matters",
  "The current situation",
  "Key challenges",
  "Our approach",
  "How it works",
  "By the numbers",
  "What people say",
  "Timeline",
  "Risks and how we handle them",
  "What success looks like",
  "Next steps",
];

function topicOf(prompt: string): string {
  const firstLine = prompt.split("\n")[0].trim().replace(/[.!?]+$/, "");
  // Cut long prompts at a word boundary so demo titles read naturally.
  const short = firstLine.length > 60 ? firstLine.slice(0, 60).replace(/\s+\S*$/, "") : firstLine;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function demoOutline(prompt: string, cardCount: number): Outline {
  const topic = topicOf(prompt) || "Your topic";
  const middle = SECTIONS.slice(0, Math.max(cardCount - 2, 0));
  return {
    title: topic,
    cards: [
      { title: topic, points: ["What this deck covers"] },
      ...middle.map((title) => ({ title, points: [] })),
      { title: "Next steps", points: ["Clear call to action"] },
    ].slice(0, cardCount),
  };
}

const LAYOUT_CYCLE = ["bullets", "stats", "timeline", "table", "columns", "quote"] as const;
const ICONS = ["💡", "🧭", "📊", "🗓️", "💬", "✅"];

export function demoCard(cardTitle: string, _deckTitle: string, index: number, total: number): GeneratedCard {
  // Photos are looked up from the card title when a Pexels key is set.
  const base: GeneratedCard = { layout: "", eyebrow: "", title: cardTitle, icon: "", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "", table: { columns: [], rows: [] }, imageQuery: cardTitle };
  if (index === 0) {
    return { ...base, layout: "title", icon: "🚀", title: cardTitle, subtitle: "Demo content: connect an AI key (Gemini or Claude) to have the AI write real slides for this topic." };
  }
  if (index === total - 1) {
    return { ...base, layout: "section", icon: "🎯", title: cardTitle, subtitle: "Agree on owners, set a date for the first milestone, and review progress in two weeks." };
  }
  const layout = LAYOUT_CYCLE[(index - 1) % LAYOUT_CYCLE.length];
  const icon = ICONS[(index - 1) % ICONS.length];
  base.eyebrow = `Part ${index}`;
  switch (layout) {
    case "table":
      return { ...base, layout, icon, title: cardTitle, subtitle: "Illustrative comparison for the demo.", table: {
        columns: ["Option", "Cost", "Time", "Best for"],
        rows: [["Do it yourself", "Low", "Slow", "Small teams"], ["Hire help", "Medium", "Fast", "Busy teams"], ["Buy a tool", "Monthly", "Fastest", "Growing teams"]],
      } };
    case "columns":
      return { ...base, layout, icon, title: cardTitle, items: [
        { heading: "Simple", text: "Easy to understand and explain in one sentence." },
        { heading: "Proven", text: "Builds on approaches that already work elsewhere." },
        { heading: "Scalable", text: "Grows without a matching growth in cost." } ] };
    case "stats":
      return { ...base, layout, icon, title: cardTitle, subtitle: "Illustrative numbers for the demo.", stats: [
        { value: "3x", label: "faster than the usual approach" },
        { value: "40%", label: "lower cost in the first year" },
        { value: "92%", label: "of pilot users would recommend it" } ] };
    case "timeline":
      return { ...base, layout, icon, title: cardTitle, items: [
        { heading: "Month 1", text: "Research, plan and line up the right people." },
        { heading: "Month 2", text: "Build a first version and test it with a small group." },
        { heading: "Month 3", text: "Improve based on feedback and roll out widely." } ] };
    case "quote":
      return { ...base, layout, icon, title: cardTitle, quote: "The best way to predict the future is to create it.", quoteAuthor: "Peter Drucker" };
    default:
      return { ...base, layout: "bullets", icon, title: cardTitle, items: [
        { heading: "Start with the problem", text: "Explain clearly who is affected and why it matters now." },
        { heading: "Show the evidence", text: "Use one or two concrete facts rather than many vague ones." },
        { heading: "Make it actionable", text: "End each point with what the audience should do or remember." } ] };
  }
}

/** CallModel implementation that never calls the API. */
export const callDemo: CallModel = async <T,>(request: ModelRequest<T>): Promise<T> => {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));
  // Demo decks skip research and fact checks (the sample text is labelled as illustrative).
  if (request.role === "research") return { factual: false, searches: [] } as T;
  if (request.role === "check") return { problems: [] } as T;
  if ((request.schema as unknown) === AssistSchema) {
    const message = /<request>\n([\s\S]*?)\n<\/request>/.exec(request.user)?.[1] ?? "";
    const count = (request.context?.match(/^\d+\. /gm) ?? []).length;
    return {
      reply: "Demo mode: here's the change I'd make. Apply it to see it in your deck.",
      actions: [{ type: "add", slide: count, title: message.slice(0, 80) || "A new slide", instruction: "", theme: "" }],
    } as T;
  }
  if ((request.schema as unknown) === SetupSchema) {
    return {
      audiences: ["Students: a clear overview", "Colleagues: the key facts fast", "Clients: why it matters to them"],
      angles: ["The big picture and main facts", "The story from start to today", "Lessons and what to do next"],
    } as T;
  }
  if ((request.schema as unknown) === OutlineSchema) {
    const count = Number(/exactly (\d+) cards/.exec(request.user)?.[1] ?? 6);
    const prompt = /<request>\n([\s\S]*?)\n<\/request>/.exec(request.user)?.[1] ?? "";
    return demoOutline(prompt, count) as T;
  }
  const match = /card (\d+) of (\d+): "([\s\S]*?)"\./.exec(request.user);
  const deckTitle = /Deck title: (.*)/.exec(request.context ?? "")?.[1] ?? "this topic";
  const index = Number(match?.[1] ?? 2) - 1;
  const total = Number(match?.[2] ?? 6);
  return demoCard(match?.[3] ?? "Untitled", deckTitle, index, total) as T;
};
