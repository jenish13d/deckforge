import { PLANS } from "@/lib/plans";

const QUESTIONS = [
  {
    q: "How does it work?",
    a: "Describe what you want to present, or paste your notes. Deckforge suggests an outline you can edit, then writes and designs each card. You can change any card afterwards.",
  },
  {
    q: "What are credits?",
    a: `Each card the AI writes uses credits: 1 in Quick, 2 in Standard and 4 in Premium. Outlines are free. The Free plan includes ${PLANS.free.monthlyCredits} credits a month; Pro includes ${PLANS.pro.monthlyCredits.toLocaleString()}. If a card fails, its credits are refunded.`,
  },
  {
    q: "Which mode should I use?",
    a: "Standard is right for most decks. Quick is great for drafts and simple topics. Premium gives the most polished writing for pitches, client work and complex subjects.",
  },
  {
    q: "Can I edit what the AI writes?",
    a: "Yes. Edit any card by hand, ask the AI to rewrite a single card with an instruction like \"shorter\" or \"make it a timeline\", reorder, add or delete cards, and switch themes at any time.",
  },
  {
    q: "How do I present or share my deck?",
    a: "Use Present for full-screen slides with arrow-key navigation, share a view-only link, or download a PDF with one slide per page.",
  },
  {
    q: "Who can see my decks?",
    a: "Only you can edit your decks. A deck can be viewed by anyone you send its link to, so only share links with people you trust.",
  },
  {
    q: "Can I cancel Pro?",
    a: "Yes, any time from your Account page. You keep Pro until the end of the period you paid for, then move to the Free plan. Your decks stay.",
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
