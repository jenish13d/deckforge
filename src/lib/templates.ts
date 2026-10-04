import type { CardContent } from "./cards";
import type { ThemeId } from "./themes";

// Starting points shown on the landing page and the create screen. `preview`
// is a real card rendered with the product's own components.

export interface Template {
  id: string;
  icon: string;
  name: string;
  description: string;
  prompt: string;
  theme: ThemeId;
  preview: CardContent;
}

const blank = { icon: "", subtitle: "", items: [], stats: [], quote: "", quoteAuthor: "" };

export const TEMPLATES: Template[] = [
  {
    id: "pitch",
    icon: "🚀",
    name: "Startup pitch",
    description: "Problem, solution, market, traction and the ask.",
    prompt: "Investor pitch deck for my startup: [what you do, who it's for, traction so far, how much you're raising]",
    theme: "midnight",
    preview: { ...blank, layout: "title", icon: "🚀", title: "Fresh meals, zero effort", subtitle: "Seed round · Chef-made weekly meals delivered across Austin" },
  },
  {
    id: "sales",
    icon: "🤝",
    name: "Sales proposal",
    description: "Win a client with a clear offer and next steps.",
    prompt: "Sales proposal for [client name]: their problem, our solution, scope, timeline, pricing and next steps",
    theme: "amalfi",
    preview: {
      ...blank,
      layout: "columns",
      icon: "🤝",
      title: "Three ways we help",
      items: [
        { heading: "Audit", text: "Find what slows your team down." },
        { heading: "Build", text: "Ship the fix in four weeks." },
        { heading: "Support", text: "Keep it running, month after month." },
      ],
    },
  },
  {
    id: "report",
    icon: "📊",
    name: "Monthly report",
    description: "Results, highlights, issues and next month's plan.",
    prompt: "Monthly results report for [team/company]: key numbers, wins, problems and the plan for next month",
    theme: "ocean",
    preview: {
      ...blank,
      layout: "stats",
      icon: "📊",
      title: "September at a glance",
      stats: [
        { value: "+18%", label: "revenue" },
        { value: "4.7★", label: "customer rating" },
        { value: "312", label: "new customers" },
      ],
    },
  },
  {
    id: "lesson",
    icon: "🎓",
    name: "Lesson or lecture",
    description: "Teach a topic step by step, with a recap.",
    prompt: "Lesson for [audience, e.g. high school students] about [topic], with simple explanations, an example and a recap",
    theme: "paper",
    preview: {
      ...blank,
      layout: "timeline",
      icon: "🎓",
      title: "How a bill becomes law",
      items: [
        { heading: "Drafted", text: "A member of Congress introduces it." },
        { heading: "Debated", text: "Committees and both chambers vote." },
        { heading: "Signed", text: "The President signs it into law." },
      ],
    },
  },
  {
    id: "onboarding",
    icon: "👋",
    name: "Team onboarding",
    description: "Welcome new hires: who we are and how we work.",
    prompt: "Onboarding deck for new employees at [company]: mission, team, tools, first-week checklist and who to ask",
    theme: "toscana",
    preview: {
      ...blank,
      layout: "bullets",
      icon: "👋",
      title: "Your first week",
      items: [
        { heading: "Day 1", text: "Meet your buddy and set up your tools." },
        { heading: "Day 3", text: "Shadow a customer call." },
        { heading: "Day 5", text: "Ship your first small task." },
      ],
    },
  },
  {
    id: "talk",
    icon: "🎤",
    name: "Talk or webinar",
    description: "A clear story for a conference talk or webinar.",
    prompt: "Conference talk about [topic] for [audience]: a strong opening, three key ideas with examples, and a memorable close",
    theme: "sunset",
    preview: {
      ...blank,
      layout: "quote",
      icon: "🎤",
      title: "Why simple wins",
      quote: "Simplicity is the ultimate sophistication.",
      quoteAuthor: "Clare Boothe Luce",
    },
  },
];

export function findTemplate(id: string | undefined): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
