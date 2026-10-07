import type { CardContent } from "./cards";
import { stems, type SourceText } from "./research";

// Fact checking: every number on a slide must appear in the sources (or in the user's
// own request), close to words that say what it counts. A quote must appear in the
// sources too. What can't be confirmed is rewritten or removed, never shown.

export interface Problem {
  /** Where on the card: "title", "subtitle", "eyebrow", "items.2", "stats.0", "table.1", "quote", or "claim". */
  field: string;
  detail: string;
}

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16",
  seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20", thirty: "30", forty: "40", fifty: "50",
  sixty: "60", seventy: "70", eighty: "80", ninety: "90", hundred: "100",
  first: "1", second: "2", third: "3", fourth: "4", fifth: "5", sixth: "6", seventh: "7", eighth: "8", ninth: "9",
  tenth: "10", twice: "2", single: "1", double: "2", triple: "3",
};
const NUMBER_WORD_RE = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join("|")})\\b`, "g");

/** Lower-cased text with digits in one form: "1,000" → "1000", "3rd" → "3". */
function normalizeDigits(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2012-\u2015\u2212]/g, "-")
    .replace(/(\d)[,\u202f\u00a0](?=\d{3}\b)/g, "$1")
    .replace(/(\d+)(st|nd|rd|th)\b/g, "$1");
}

/** Source text with numbers in one form, words included: "four" → "4". */
export function normalizeNumbers(text: string): string {
  return normalizeDigits(text).replace(NUMBER_WORD_RE, (w) => NUMBER_WORDS[w]);
}

// Labels like "Step 2" or "Day 3" are structure, not facts.
const STRUCTURAL = /\b(step|day|week|month|phase|part|stage|level|round|chapter|slide|card|option|tip|tier|plan|q|no\.?|#)\s*$/;

/** The numbers in a piece of slide text, minus [placeholders] and structural labels. */
export function numbersIn(text: string): string[] {
  // Only figures written as digits count: "first" or "two" on a slide aren't checked as numbers.
  const clean = normalizeDigits(text.replace(/\[[^\]]*\]/g, " "));
  const out: string[] = [];
  for (const m of clean.matchAll(/\d+(?:\.\d+)?/g)) {
    const before = clean.slice(Math.max(0, m.index - 12), m.index);
    if (Number(m[0]) <= 12 && STRUCTURAL.test(before)) continue;
    if (!out.includes(m[0])) out.push(m[0]);
  }
  return out;
}

function occurrences(haystack: string, number: string): number[] {
  const at: number[] = [];
  const re = new RegExp(`(?<![\\d.])${number.replace(".", "\\.")}(?!\\d|\\.\\d)`, "g");
  for (const m of haystack.matchAll(re)) at.push(m.index);
  return at;
}

const WINDOW = 320;

/** How often each word stem appears in the source. */
export function stemCounts(source: string): Map<string, number> {
  const counts = new Map<string, number>();
  const words = source.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]{3,}/g) ?? [];
  for (const w of words) counts.set(w.slice(0, 5), (counts.get(w.slice(0, 5)) ?? 0) + 1);
  return counts;
}

/**
 * Whether `number` appears in the source near words that say what it counts
 * ("4" next to "Champions League"; a stray "4" elsewhere doesn't count). Words found
 * all over the source (the subject's own name, say) aren't enough on their own.
 */
export function supportedNumber(number: string, context: string, source: string, counts = stemCounts(source)): boolean {
  const want = [...stems(context)];
  const common = (w: string) => (counts.get(w) ?? 0) > Math.max(8, source.length / 1500);
  const distinctive = want.filter((w) => !common(w));
  for (const i of occurrences(source, number)) {
    if (want.length === 0) return true;
    const near = stems(source.slice(Math.max(0, i - WINDOW), i + WINDOW));
    if (distinctive.length > 0) {
      if (distinctive.some((w) => near.has(w))) return true;
    } else if (want.filter((w) => near.has(w)).length >= Math.min(2, want.length)) {
      return true;
    }
  }
  return false;
}

/** Whether a quote appears in the source (allowing small differences in punctuation and wording). */
export function quoteInSource(quote: string, source: string): boolean {
  const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const q = words(quote);
  if (q.length === 0) return true;
  const hay = ` ${words(source).join(" ")} `;
  if (q.length < 5) return hay.includes(` ${q.join(" ")} `);
  let found = 0;
  let windows = 0;
  for (let i = 0; i + 5 <= q.length; i++, windows++) if (hay.includes(` ${q.slice(i, i + 5).join(" ")} `)) found++;
  return found / windows >= 0.6;
}

/**
 * Whether the sources show this as something the author actually said: the words must sit
 * inside quotation marks in a source, with the author's name close by. Ordinary prose
 * (like an encyclopedia's first sentence) is not a quote, even when it is word for word.
 */
export function quoteAttributed(quote: string, author: string, source: string): boolean {
  const name = author.trim().split(/\s+/).filter((w) => w.length > 2).pop()?.toLowerCase();
  if (!name) return false;
  const spans = /[“"«„]([^“”"«»„]{12,800})[”"»“]/g;
  for (let m = spans.exec(source); m; m = spans.exec(source)) {
    if (!quoteInSource(quote, m[1])) continue;
    const around = source.slice(Math.max(0, m.index - 400), m.index + m[0].length + 400).toLowerCase();
    if (around.includes(name)) return true;
  }
  return false;
}

interface Field {
  field: string;
  text: string;
  context: string;
}

function fieldsOf(card: CardContent): Field[] {
  const fields: Field[] = [
    { field: "title", text: card.title, context: `${card.title} ${card.subtitle}` },
    { field: "subtitle", text: card.subtitle, context: card.subtitle },
    { field: "eyebrow", text: card.eyebrow, context: `${card.eyebrow} ${card.title}` },
  ];
  card.items.forEach((item, i) => fields.push({ field: `items.${i}`, text: `${item.heading} ${item.text}`, context: `${item.heading} ${item.text}` }));
  card.stats.forEach((stat, i) =>
    fields.push({ field: `stats.${i}`, text: `${stat.value} ${stat.label}`, context: stat.label || `${card.title} ${card.subtitle}` }),
  );
  card.table.rows.forEach((row, i) => fields.push({ field: `table.${i}`, text: row.join(" "), context: `${row.join(" ")} ${card.table.columns.join(" ")}` }));
  if (card.layout === "quote") fields.push({ field: "quoteAuthor", text: card.quoteAuthor, context: card.quoteAuthor });
  return fields;
}

/** How many independent sources must agree on a number: two when there are two or more. */
export const requiredAgreement = (groups: number) => Math.min(2, Math.max(1, groups));

/**
 * Numbers and quotes on the card that the sources don't back up. A number needs two
 * independent sources (all Wikipedia articles count as one source, each website as one);
 * with a single source, that one. `allowed` is the user's own request: figures they gave
 * are always fine.
 */
export function verifyCard(card: CardContent, texts: SourceText[], allowed: string): Problem[] {
  const byGroup = new Map<string, string>();
  for (const t of texts) {
    const key = t.group ?? t.title;
    byGroup.set(key, `${byGroup.get(key) ?? ""}\n\n${t.text}`);
  }
  const groups = [...byGroup.values()].map((text) => {
    const src = normalizeNumbers(text);
    return { src, counts: stemCounts(src) };
  });
  const required = requiredAgreement(groups.length);
  const own = normalizeNumbers(allowed);
  const problems: Problem[] = [];
  for (const f of fieldsOf(card)) {
    for (const n of numbersIn(f.text)) {
      if (occurrences(own, n).length > 0) continue;
      const agreeing = groups.filter((g) => supportedNumber(n, f.context, g.src, g.counts)).length;
      if (agreeing >= required) continue;
      problems.push({
        field: f.field,
        detail:
          agreeing === 0
            ? `"${n}" in "${f.text.trim().slice(0, 120)}" isn't in the sources`
            : `"${n}" in "${f.text.trim().slice(0, 120)}" is in only one source; it needs two that agree`,
      });
    }
  }
  const all = texts.map((t) => t.text).join("\n");
  if (card.layout === "quote" && card.quote && !quoteInSource(card.quote, allowed)) {
    if (!quoteInSource(card.quote, all)) {
      problems.push({ field: "quote", detail: `The quote "${card.quote.slice(0, 120)}" isn't in the sources` });
    } else if (!quoteAttributed(card.quote, card.quoteAuthor, all)) {
      problems.push({
        field: "quote",
        detail: `"${card.quote.slice(0, 120)}" is the sources' own wording, not something ${card.quoteAuthor || "anyone"} said; don't present it as a quote`,
      });
    }
  }
  return problems;
}

export const describeProblems = (problems: Problem[]) => problems.map((p) => `- ${p.detail}`).join("\n");

/**
 * Last resort after a rewrite still fails: drop whatever couldn't be confirmed and
 * fall back to a simpler layout if too little is left.
 */
export function stripUnverified(card: CardContent, problems: Problem[], fallbackTitle: string): CardContent {
  const bad = new Set(problems.map((p) => p.field));
  const keep = <T,>(list: T[], prefix: string) => list.filter((_, i) => !bad.has(`${prefix}.${i}`));
  const out: CardContent = {
    ...card,
    title: bad.has("title") ? fallbackTitle.replace(/\d[\d.,]*/g, "").replace(/\s+/g, " ").trim() || card.title : card.title,
    subtitle: bad.has("subtitle") ? "" : card.subtitle,
    eyebrow: bad.has("eyebrow") ? "" : card.eyebrow,
    items: keep(card.items, "items"),
    stats: keep(card.stats, "stats"),
    table: { columns: card.table.columns, rows: keep(card.table.rows, "table") },
    quoteAuthor: bad.has("quoteAuthor") ? "" : card.quoteAuthor,
  };

  const asSection = (): CardContent => {
    const item = out.items[0];
    return {
      ...out,
      layout: "section",
      subtitle: out.subtitle || (item ? `${item.heading}${item.text ? `: ${item.text}` : ""}` : ""),
      items: [],
      stats: [],
      table: { columns: [], rows: [] },
      quote: "",
      quoteAuthor: "",
    };
  };

  if (bad.has("quote")) return asSection();
  if (out.layout === "stats" && out.stats.length === 0) return asSection();
  if (out.layout === "table" && out.table.rows.length < 2) return asSection();
  if (["bullets", "columns", "timeline"].includes(out.layout) && out.items.length < 2) return asSection();
  return out;
}
