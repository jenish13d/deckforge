import { TEMPLATES, type Template } from "./templates";

// One page per template: what it asks the AI for, and a real preview card. The outline lists
// come from each template's own prompt, so nothing here promises more than the template does.

export interface TemplatePage {
  id: string;
  slug: string;
  title: string;
  description: string;
  lead: string;
  /** What the template asks the AI to cover. */
  covers: string[];
  /** Who it suits. */
  suits: string;
  /** A concrete case, in plain words. */
  example: string;
  /** Guide pages worth a link from here (paths). */
  also: { href: string; name: string }[];
}

export const TEMPLATE_PAGES: TemplatePage[] = [
  {
    id: "pitch",
    slug: "pitch-deck",
    title: "Startup pitch deck template",
    description: "A pitch deck template for founders: problem, solution, market, traction and the ask. The AI fills it in from your notes and never invents your numbers.",
    lead: "Fill in what you do, who it's for, your traction and the amount you're raising. Slidezza turns it into a structured pitch.",
    covers: ["The problem", "Your solution", "Market and who it's for", "Traction so far", "The ask: how much you're raising"],
    suits: "Founders preparing for investors, accelerators or demo days.",
    example: "A founder of a meal-prep subscription fills in what the business does, who it serves and how much is being raised. Slidezza lays out the problem, the offer, the market, traction and the ask, using only the numbers the founder supplies.",
    also: [{ href: "/pitch-deck-generator", name: "Pitch deck generator" }, { href: "/sales-presentation-maker", name: "Sales presentation maker" }],
  },
  {
    id: "sales",
    slug: "sales-proposal",
    title: "Sales proposal presentation template",
    description: "A sales proposal template: the client's problem, your solution, scope, timeline, pricing and next steps. Edit the outline, then share a link or download.",
    lead: "Name the client and their problem. Slidezza lays out the offer, the scope, the timeline, the price and what happens next.",
    covers: ["The client's problem", "Your solution", "Scope", "Timeline", "Pricing", "Next steps"],
    suits: "Freelancers, agencies and sales teams writing a proposal for one client.",
    example: "A freelance web designer names a dental clinic as the client, describes its outdated site and lists scope, timeline and price. The deck turns that into a proposal the clinic can read in one sitting.",
    also: [{ href: "/sales-presentation-maker", name: "Sales presentation maker" }, { href: "/business-presentation-maker", name: "Business presentation maker" }],
  },
  {
    id: "report",
    slug: "business-report",
    title: "Monthly business report template",
    description: "A monthly report presentation template: key numbers, wins, problems and next month's plan. Your figures are used as given; results become big-number slides.",
    lead: "Give it your numbers or attach the spreadsheet. Slidezza turns them into a report with the headline figures up front.",
    covers: ["Key numbers", "Wins", "Problems", "The plan for next month"],
    suits: "Team leads and managers who report every month.",
    example: "A team lead attaches the month's results spreadsheet. The headline figures become big-number slides, the wins and problems follow, and the last slide lists next month's plan.",
    also: [{ href: "/make/business-report-presentation", name: "Business report presentations" }, { href: "/marketing-presentation-maker", name: "Marketing presentation maker" }],
  },
  {
    id: "lesson",
    slug: "lesson-presentation",
    title: "Lesson presentation template",
    description: "A lesson or lecture template that teaches a topic step by step: simple explanations, an example and a recap. Pitched at the class level you choose.",
    lead: "Say the topic and the class. Slidezza writes a lesson with simple explanations, an example and a recap.",
    covers: ["Simple explanations", "An example", "A recap"],
    suits: "Teachers, tutors and lecturers.",
    example: "A teacher asks for a lesson on how a bill becomes law for high school students. The deck explains each step simply, gives an example and ends with a recap.",
    also: [{ href: "/presentation-maker-for-teachers", name: "Presentation maker for teachers" }, { href: "/presentation-maker-for-students", name: "Presentation maker for students" }],
  },
  {
    id: "onboarding",
    slug: "onboarding-presentation",
    title: "Employee onboarding presentation template",
    description: "A team onboarding deck template: mission, team, tools, a first-week checklist and who to ask. Welcome new hires with a clear first week.",
    lead: "Add your company details. Slidezza builds a welcome deck with the mission, the team, the tools and a first-week checklist.",
    covers: ["Mission", "The team", "Tools", "First-week checklist", "Who to ask"],
    suits: "HR, managers and founders welcoming new people.",
    example: "An operations manager adds the company name, tools and who to ask for what. The deck becomes a welcome pack with a day-by-day first week.",
    also: [{ href: "/business-presentation-maker", name: "Business presentation maker" }, { href: "/presentation-from-prompt", name: "Presentation from a prompt" }],
  },
  {
    id: "talk",
    slug: "conference-talk",
    title: "Conference talk and webinar template",
    description: "A talk or webinar template with a strong opening, three key ideas with examples and a memorable close. Edit the outline before the slides are written.",
    lead: "Give it the topic and the audience. Slidezza shapes a talk with an opening, three ideas and a close.",
    covers: ["A strong opening", "Three key ideas, each with an example", "A memorable close"],
    suits: "Speakers at conferences, meetups and webinars.",
    example: "A speaker gives a topic and audience for a 20-minute meetup talk. Slidezza shapes an opening, three ideas with an example each, and a closing slide to remember.",
    also: [{ href: "/presentation-from-prompt", name: "Presentation from a prompt" }, { href: "/research-presentation-maker", name: "Research presentation maker" }],
  },
];

export const findTemplatePage = (slug: string) => TEMPLATE_PAGES.find((p) => p.slug === slug);

export function templateFor(page: TemplatePage): Template {
  const template = TEMPLATES.find((t) => t.id === page.id);
  if (!template) throw new Error(`Template ${page.id} is missing`);
  return template;
}
