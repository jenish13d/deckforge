import { PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const QUESTIONS = [
  {
    q: "How does it work?",
    a: `Describe what you want to present, or attach your notes or files. Answer two quick questions and ${SITE.name} suggests an outline you can edit, then writes and designs each card. You can change any card afterwards.`,
  },
  {
    q: "What are credits?",
    a: `Each card the AI writes uses credits: 1 in Quick, 2 in Standard and 4 in Premium. Outlines are free. The Free plan includes ${PLANS.free.monthlyCredits} credits a month, Pro ${PLANS.pro.monthlyCredits.toLocaleString("en-US")} and Max ${PLANS.max.monthlyCredits.toLocaleString("en-US")}. If a card fails, its credits are refunded.`,
  },
  {
    q: "Can I make slides from a PDF, Word file or photo?",
    a: "Yes. Attach up to 5 files (PDF including scans, Word .docx, PowerPoint .pptx, Excel .xlsx, CSV, text or photos of notes) and the deck is built from what they say. Figures from your files are used as given, and the files are listed as sources.",
  },
  {
    q: "Are the facts accurate?",
    a: "For factual topics the AI writes only from the sources it finds (Wikipedia and independent web pages), and a number appears on a slide only when two independent sources agree. The sources are listed with every deck so you can check them. Mistakes are still possible, so review before you present.",
  },
  {
    q: "Which mode should I use?",
    a: "Standard is right for most decks. Quick is great for drafts and simple topics. Premium gives the most polished writing for pitches, client work and complex subjects.",
  },
  {
    q: "Can I edit what the AI writes?",
    a: "Yes. Edit any card by hand, ask the AI to rewrite a single card with an instruction like “shorter” or “make it a timeline”, reorder, add or delete cards, and switch themes at any time.",
  },
  {
    q: "How do I present or share my deck?",
    a: "Use Present for full-screen slides with arrow-key navigation, share a view-only link, or download a PDF (every plan) or an editable PowerPoint file (Pro and Max).",
  },
  {
    q: "Who can see my decks?",
    a: "Only you can edit your decks. By default, anyone you send a deck's link to can view it. You can make any deck private from its Share window, and delete decks or your whole account at any time.",
  },
  {
    q: "Can I cancel Pro or Max?",
    a: "Yes, any time from your Account page. You keep your plan until the end of the period you paid for, then move to the Free plan. Your decks stay.",
  },
];

export function Faq() {
  return (
    <div className="faq">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="faq__item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
