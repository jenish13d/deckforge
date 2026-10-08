import { MAX_FILE_MB, MAX_FILES } from "@/lib/material";
import { MODES, PLANS } from "@/lib/plans";
import { SEARCH_PAGES } from "@/lib/search-pages";
import { SITE } from "@/lib/site";
import { TEMPLATE_PAGES } from "@/lib/template-pages";
import { TEMPLATES } from "@/lib/templates";
import { THEMES } from "@/lib/themes";
import { siteUrl } from "@/lib/url";
import { USE_CASES } from "@/lib/use-cases";

const MATERIAL_TYPES = "PDF (including scans), Word .docx, PowerPoint .pptx, Excel .xlsx, CSV, text and Markdown, and photos";

/** Plain-text summary for AI assistants (the llms.txt convention). */
export function GET() {
  const url = siteUrl();
  const text = `# ${SITE.name}

> ${SITE.name} is an AI presentation maker. Describe a topic, or attach your own material (PDF, Word, PowerPoint, Excel, text or photos), answer two quick questions, edit the outline, and it researches, writes and designs the slides.

## What it does
- Topic or files → quick choices (audience, focus, length, detail) → editable outline → finished deck, card by card
- Build a deck from your files: ${MATERIAL_TYPES}. Up to ${MAX_FILES} files per deck, ${MAX_FILE_MB} MB each. Documents are read in the browser; photos and scans are read by an AI vision model
- Research for factual topics: Wikipedia articles plus independent web pages, listed as sources with the deck
- Fact checking: a number appears on a slide only when two independent sources agree (figures from the user's own files are used as given); quotes must be word for word from a source
- Detail levels: Low (short), Medium (presentation-ready), High (more facts per slide, wider research)
- ${THEMES.length} themes (${THEMES.map((t) => t.name).join(", ")}) and 8 layouts (title, section, bullets, columns, big numbers, timeline, table, quote)
- Real photos from Wikimedia Commons and Openverse, credited on the slide or on a credits slide
- An assistant in the editor ("Ask ${SITE.name}") adds or rewrites slides and changes the theme from a plain request
- Present full screen, share a view-only link (or keep a deck private), download PDF (all plans) or PowerPoint .pptx (${PLANS.pro.label} and ${PLANS.max.label})
- Works in any language
- Templates: ${TEMPLATES.map((t) => t.name).join(", ")}

## Pricing (USD)
- ${PLANS.free.label}: ${PLANS.free.price}, ${PLANS.free.monthlyCredits} credits a month, no card needed. Medium detail, "Made with ${SITE.name}" badge
- ${PLANS.pro.label}: ${PLANS.pro.price}, ${PLANS.pro.monthlyCredits.toLocaleString("en-US")} credits a month. All detail levels, Premium mode, PowerPoint export, no badge
- ${PLANS.max.label}: ${PLANS.max.price}, ${PLANS.max.monthlyCredits.toLocaleString("en-US")} credits a month, unused credits roll over up to 2× the monthly amount, priority generation (more cards written at once)
- Credits per card: ${Object.values(MODES).map((m) => `${m.label} ${m.creditsPerCard}`).join(", ")}. Outlines are free; failed cards are refunded.

## Guides
${[...SEARCH_PAGES.map((p) => ({ ...p, path: `/${p.slug}` })), ...USE_CASES.map((u) => ({ ...u, path: `/make/${u.slug}` }))].map((u) => `- [${u.title}](${url}${u.path}): ${u.description}`).join("\n")}

## Template pages
${TEMPLATE_PAGES.map((p) => `- [${p.title}](${url}/templates/${p.slug}): ${p.description}`).join("\n")}

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
