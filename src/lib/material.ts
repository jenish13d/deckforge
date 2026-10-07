import { FILE_PREFIX, type Research, type SourceText } from "./research";

// Material the user attaches (PDF, Word, PowerPoint, Excel, text, photos) to build a deck from.
// Files are read in the browser; only their text is sent, and it is stored with the deck's research.

export const MAX_FILES = 5;
export const MAX_FILE_MB = 15;
/** Text kept from one file, and from all files together. */
export const MAX_FILE_CHARS = 20_000;
export const MAX_MATERIAL_CHARS = 40_000;

export const MATERIAL_ACCEPT =
  ".pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.html,.htm,.rtf,image/png,image/jpeg,image/webp,image/gif,image/heic";

export interface Material {
  name: string;
  text: string;
}

/** Tidies extracted text: one paragraph per line, no runs of spaces, long paragraphs split at sentences. */
export function tidyText(text: string): string {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .replace(/[\t  ]+/g, " ")
    .split(/\n\s*\n|\n(?=\s*[-•*\d]+[.)]?\s)/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  // Headings and short bullets join the text around them, so no fact is too short to be found.
  const merged: string[] = [];
  let short = "";
  for (const p of paragraphs) {
    if (p.length < 120) {
      short = short ? `${short} · ${p}` : p;
      if (short.length < 300) continue;
      merged.push(short);
    } else {
      merged.push(short ? `${short} · ${p}` : p);
    }
    short = "";
  }
  if (short) merged.push(short);
  return merged.flatMap((p) => splitLong(p, 700)).join("\n");
}

function splitLong(paragraph: string, max: number): string[] {
  if (paragraph.length <= max) return [paragraph];
  const parts: string[] = [];
  let current = "";
  for (const sentence of paragraph.match(/[^.!?]+[.!?]*\s*/g) ?? [paragraph]) {
    if (current && current.length + sentence.length > max) {
      parts.push(current.trim());
      current = "";
    }
    current += sentence;
    while (current.length > max * 1.5) {
      parts.push(current.slice(0, max).trim());
      current = current.slice(max);
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Material from a request body: at most MAX_FILES files and MAX_MATERIAL_CHARS of text in all. */
export function parseMaterial(value: unknown): Material[] {
  if (!Array.isArray(value)) return [];
  const list: Material[] = [];
  let room = MAX_MATERIAL_CHARS;
  for (const item of value.slice(0, MAX_FILES)) {
    if (!item || typeof item !== "object") continue;
    const { name, text } = item as Record<string, unknown>;
    if (typeof name !== "string" || typeof text !== "string") continue;
    const clean = tidyText(text).slice(0, Math.min(MAX_FILE_CHARS, room));
    const title = name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 120) || "Attached file";
    if (clean.length < 20) continue;
    // Two files with the same name stay separate sources.
    const unique = list.some((m) => m.name === title) ? `${title} (${list.length + 1})` : title;
    list.push({ name: unique, text: clean });
    room -= clean.length;
    if (room <= 0) break;
  }
  return list;
}

/** The material as research sources, so cards are written and checked against it. */
export function materialResearch(material: Material[]): Research {
  return {
    sources: material.map((m) => ({ title: m.name, url: `${FILE_PREFIX}${m.name}`, kind: "file" as const })),
    webTexts: material.map((m) => ({ title: `${FILE_PREFIX}${m.name}`, text: m.text })),
  };
}

/** Paragraphs spread evenly across the whole material, within `maxChars` (for planning the deck). */
export function spreadExcerpt(texts: SourceText[], maxChars: number): string {
  const paragraphs = texts.flatMap((t) =>
    t.text.split("\n").filter((p) => p.trim().length > 20).map((p) => `[${t.title}] ${p.trim()}`),
  );
  const total = paragraphs.reduce((n, p) => n + p.length + 2, 0);
  if (total <= maxChars) return paragraphs.join("\n\n");
  const chosen: string[] = [];
  let used = 0;
  const step = total / maxChars;
  for (let i = 0; i < paragraphs.length; i += step) {
    const p = paragraphs[Math.floor(i)];
    if (used + p.length > maxChars) continue;
    chosen.push(p);
    used += p.length + 2;
  }
  return chosen.join("\n\n");
}

/** A short description of the material, for steps that only need the gist (setup choices, research). */
export function materialGist(material: Material[], chars = 800): string {
  if (material.length === 0) return "";
  const each = Math.floor(chars / material.length);
  return material.map((m) => `${m.name}: ${m.text.slice(0, each).replace(/\n/g, " ")}`).join("\n");
}
