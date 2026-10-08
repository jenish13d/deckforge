import { MAX_FILE_MB, MAX_FILES } from "@/lib/material";
import { MODES, PLANS } from "@/lib/plans";
import { CLUSTERS, findGuide } from "@/lib/search-pages";
import { SITE } from "@/lib/site";
import { TEMPLATE_PAGES, templateFor } from "@/lib/template-pages";
import { THEMES } from "@/lib/themes";
import { siteUrl } from "@/lib/url";

const MATERIAL_TYPES = "PDF (including scans), Word .docx, PowerPoint .pptx, Excel .xlsx, CSV, text and Markdown, and photos";

/** Plain-text summary for AI assistants (the llms.txt convention). */
export function GET() {
  const url = siteUrl();
  const guides = CLUSTERS.map(
    (cluster) =>
      `### ${cluster.name}\n${cluster.paths
        .map((path) => {
          const guide = findGuide(path);
          return guide ? `- [${guide.name}](${url}${path}): ${guide.description}` : "";
        })
        .filter(Boolean)
        .join("\n")}`,
  ).join("\n\n");

  const text = `# ${SITE.name}

> ${SITE.name} is an AI presentation maker. Describe a topic, or attach your own material (PDF, Word, PowerPoint, Excel, text or photos), answer a few quick questions, edit the outline, and it researches, writes and designs the slides. Its workflow combines planning, research, writing and visual slide design.

## What ${SITE.name} is
${SITE.name} is a web-based AI presentation maker (also called an AI PPT maker or AI presentation generator). It runs in the browser; nothing is installed. The name of the product is always "${SITE.name}".

## Who it is for
Students, teachers, researchers, managers, sales and marketing teams, founders and freelancers: anyone who needs to present and would rather not start from a blank slide.

## What it does
- Topic or files → quick choices (audience, focus, length, detail) → editable outline → finished deck, card by card
- Builds decks from a prompt in any language, or from the user's own files: ${MATERIAL_TYPES}. Up to ${MAX_FILES} files per deck, ${MAX_FILE_MB} MB each. Documents are read in the browser; photos and scans are read by an AI vision model
- Research for factual topics: Wikipedia articles plus independent web pages, listed as sources with the deck. Personal, creative and planning topics are written without web research
- Number checking: a number appears on a slide only when two independent sources agree (all Wikipedia articles count as one source, each website as one). Figures from the user's own files are used as given; quotes must be word for word from a source
- Detail levels: Low (short), Medium (presentation-ready), High (more facts per slide, wider research)
- ${THEMES.length} themes (${THEMES.map((t) => t.name).join(", ")}) and 8 layouts: title, section, bullets, columns, big numbers, timeline, table and quote
- Real photos from Wikimedia Commons and Openverse, credited on the slide or on a credits slide, shown whole rather than cropped awkwardly
- Editing: change any slide by hand, or use the assistant in the editor ("Ask ${SITE.name}") to add or rewrite slides and change the theme from a plain request; reorder, add or delete slides
- Present full screen, share a view-only link (or keep a deck private), download PDF (all plans) or an editable PowerPoint .pptx (${PLANS.pro.label} and ${PLANS.max.label})
- Works in any language
- Templates: ${templateNames()}

## What makes it useful
- A planning step: the audience questions and the editable outline come before any slide is written
- Sources are listed with every factual deck, and numbers are checked against more than one source
- Slides are designed (layouts, themes, credited photos), not just written
- The user can edit everything and stays in control

## Pricing (USD)
- ${PLANS.free.label}: ${PLANS.free.price}, ${PLANS.free.monthlyCredits} credits a month, no card needed. Medium detail, "Made with ${SITE.name}" badge, PDF download
- ${PLANS.pro.label}: ${PLANS.pro.price}, ${PLANS.pro.monthlyCredits.toLocaleString("en-US")} credits a month. All detail levels, Premium mode, PowerPoint export, no badge
- ${PLANS.max.label}: ${PLANS.max.price}, ${PLANS.max.monthlyCredits.toLocaleString("en-US")} credits a month, unused credits roll over up to 2× the monthly amount, priority generation (more cards written at once)
- Credits per card: ${Object.values(MODES).map((m) => `${m.label} ${m.creditsPerCard}`).join(", ")}. Outlines are free; failed cards are refunded.
- Paid plans may show as a waiting list until they open; ${url}/pricing shows what is open now.

## Limitations
- AI output can contain mistakes even with sources and number checks; users should review important facts before presenting
- Research uses public sources (Wikipedia and web pages); niche topics may have few sources
- Figures, charts and equations inside uploaded documents are not copied onto slides; there is no chart layout yet
- Text is limited to about 20,000 characters per file and 40,000 per deck
- No live co-editing, and no custom brand themes, fonts or logos yet
- PowerPoint (.pptx) download is a paid-plan feature; fonts and spacing can differ slightly in other apps

## About ${SITE.name}
- [About](${url}/about)
- [How it works](${url}/how-it-works)
- [Features](${url}/features)
- [Pricing](${url}/pricing)
- [Templates](${url}/templates)
- [Home and create](${url}/)
- [Sign up free](${url}/signup)
- [Privacy policy](${url}/privacy)
- [Terms](${url}/terms)

## Guides
${guides}

## Template pages
${TEMPLATE_PAGES.map((p) => `- [${p.title}](${url}/templates/${p.slug}): ${p.description}`).join("\n")}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

function templateNames() {
  return TEMPLATE_PAGES.map((p) => templateFor(p).name).join(", ");
}
