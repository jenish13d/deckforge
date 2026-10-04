import { MODES, PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { TEMPLATES } from "@/lib/templates";
import { THEMES } from "@/lib/themes";
import { siteUrl } from "@/lib/url";

/** Plain-text summary for AI assistants (the llms.txt convention). */
export function GET() {
  const url = siteUrl();
  const text = `# ${SITE.name}

> ${SITE.name} is an AI presentation maker. Describe a topic or paste notes, review and edit the outline, and it writes and designs the slides. ${SITE.tagline}.

## What it does
- Prompt → editable outline → finished deck, card by card
- ${THEMES.length} themes (${THEMES.map((t) => t.name).join(", ")}), 7 layouts (title, section, bullets, columns, big numbers, quote, timeline)
- Free stock photos on slides, credited automatically
- Edit any slide by hand or rewrite one slide with an instruction
- Present full-screen, share a view-only link (or keep a deck private), download PDF or PowerPoint (.pptx)
- Works in any language
- Templates: ${TEMPLATES.map((t) => t.name).join(", ")}

## Pricing
- ${PLANS.free.label}: $0, ${PLANS.free.monthlyCredits} credits a month, no card needed
- ${PLANS.pro.label}: $12 a month, ${PLANS.pro.monthlyCredits.toLocaleString()} credits a month
- Credits per slide: ${Object.values(MODES).map((m) => `${m.label} ${m.creditsPerCard}`).join(", ")}. Outlines are free; failed slides are refunded.

## Links
- [Home and create](${url}/)
- [Templates](${url}/templates)
- [Pricing](${url}/pricing)
- [Sign up free](${url}/signup)
- [Privacy policy](${url}/privacy)
- [Terms](${url}/terms)
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
