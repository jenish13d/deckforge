"use client";

import { api } from "./client";
import { MAX_FILE_CHARS, MAX_FILE_MB } from "./material";

// Reads an attached file's text in the browser. Documents never leave the device; photos and
// scanned pages are scaled down and sent to /api/extract, where an AI reads the text in them.

export class FileReadError extends Error {}

const ext = (name: string) => name.toLowerCase().split(".").pop() ?? "";

export async function readMaterialFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new FileReadError(`Files can be up to ${MAX_FILE_MB} MB.`);
  const kind = ext(file.name);
  let text: string;
  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(kind)) {
    text = await readPhoto(file);
  } else if (kind === "pdf" || file.type === "application/pdf") {
    text = await readPdf(file);
  } else if (kind === "docx") {
    text = await readDocx(file);
  } else if (kind === "pptx") {
    text = await readPptx(file);
  } else if (kind === "xlsx") {
    text = await readXlsx(file);
  } else if (["doc", "ppt", "xls", "pages", "key", "numbers"].includes(kind)) {
    throw new FileReadError("Save it as .docx, .pptx, .xlsx or PDF first, then attach it again.");
  } else if (["html", "htm"].includes(kind)) {
    text = new DOMParser().parseFromString(await file.text(), "text/html").body.innerText ?? "";
  } else if (kind === "rtf") {
    text = rtfToText(await file.text());
  } else {
    text = await file.text();
    // A binary file read as text is mostly control characters.
    if (/[\u0000-\u0008\u000e-\u001f]/.test(text.slice(0, 2000))) throw new FileReadError("This file type can't be read. Try PDF, Word, PowerPoint, Excel, text or a photo.");
  }
  text = text.trim();
  if (text.length < 20) throw new FileReadError("No text was found in this file.");
  return text.slice(0, MAX_FILE_CHARS);
}

// --- Office files are zip archives of XML ---

async function unzip(file: File) {
  const { default: JSZip } = await import("jszip");
  try {
    return await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new FileReadError("This file looks damaged or password-protected.");
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export const decodeXml = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1].toLowerCase() === "x" ? 2 : 1), e[1].toLowerCase() === "x" ? 16 : 10)) : (ENTITIES[e] ?? m),
  );

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Paragraph text from WordprocessingML or DrawingML: one line per paragraph. */
export function xmlParagraphs(xml: string, paragraph: "w" | "a"): string[] {
  const textTag = new RegExp(`<${paragraph}:t(?:\\s[^>]*)?>([^<]*)</${paragraph}:t>|<${paragraph}:tab/>|<${paragraph}:br/>`, "g");
  return xml
    .split(new RegExp(`</${paragraph}:p>`))
    .map((p) => {
      let line = "";
      for (const m of p.matchAll(textTag)) line += m[1] !== undefined ? decodeXml(m[1]) : " ";
      return line.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);
}

async function readDocx(file: File): Promise<string> {
  const zip = await unzip(file);
  const doc = await zip.file("word/document.xml")?.async("string");
  if (!doc) throw new FileReadError("This doesn't look like a Word document.");
  // Tables: each row on one line, cells separated by " | ".
  const flat = doc.replace(/<w:tbl[ >][\s\S]*?<\/w:tbl>/g, (table) =>
    (table.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? [])
      .map((row) => {
        const cells = (row.match(/<w:tc[ >][\s\S]*?<\/w:tc>/g) ?? []).map((cell) => xmlParagraphs(cell, "w").join(" "));
        return `<w:p><w:t>${escapeXml(cells.join(" | "))}</w:t></w:p>`;
      })
      .join(""),
  );
  return xmlParagraphs(flat, "w").join("\n");
}

const slideNumber = (path: string) => Number(/(\d+)\.xml$/.exec(path)?.[1] ?? 0);

async function readPptx(file: File): Promise<string> {
  const zip = await unzip(file);
  const slides = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => slideNumber(a) - slideNumber(b));
  if (slides.length === 0) throw new FileReadError("This doesn't look like a PowerPoint file.");
  const parts = await Promise.all(
    slides.map(async (path) => {
      const n = slideNumber(path);
      const lines = xmlParagraphs((await zip.file(path)?.async("string")) ?? "", "a");
      const notes = xmlParagraphs((await zip.file(`ppt/notesSlides/notesSlide${n}.xml`)?.async("string")) ?? "", "a").filter((l) => !/^\d+$/.test(l));
      return [`Slide ${n}: ${lines.join(" · ")}`, notes.length ? `Notes: ${notes.join(" ")}` : ""].filter(Boolean).join("\n");
    }),
  );
  return parts.join("\n\n");
}

async function readXlsx(file: File): Promise<string> {
  const zip = await unzip(file);
  const shared = [...((await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((t) => decodeXml(t[1])).join(""),
  );
  const sheets = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort((a, b) => slideNumber(a) - slideNumber(b));
  if (sheets.length === 0) throw new FileReadError("This doesn't look like an Excel file.");
  const out: string[] = [];
  for (const path of sheets) {
    const xml = (await zip.file(path)?.async("string")) ?? "";
    const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
      [...r[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)]
        .map(([, attrs, inner = ""]) => {
          const value = /<v>([^<]*)<\/v>/.exec(inner)?.[1];
          if (/t="s"/.test(attrs)) return shared[Number(value)] ?? "";
          if (/t="inlineStr"/.test(attrs)) return decodeXml(/<t[^>]*>([^<]*)<\/t>/.exec(inner)?.[1] ?? "");
          return decodeXml(value ?? "");
        })
        .join(" | ")
        .replace(/(\s\|\s)+$/, ""),
    ).filter((r) => r.replace(/[\s|]/g, ""));
    out.push(...tableChunks(`Sheet ${slideNumber(path)}`, rows));
  }
  return out.join("\n\n");
}

/** Table rows in chunks that repeat the header, so each part makes sense on its own. */
export function tableChunks(label: string, rows: string[], size = 12): string[] {
  const [header, ...body] = rows;
  if (!header) return [];
  const chunks: string[] = [];
  for (let i = 0; i < Math.max(body.length, 1); i += size) {
    chunks.push(`${label}. Columns: ${header}. Rows: ${body.slice(i, i + size).join(" ; ")}`);
  }
  return chunks;
}

function rtfToText(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\[a-z]+-?\d* ?|[{}]/gi, "")
    .trim();
}

// --- PDF ---

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") throw new FileReadError("This PDF is password-protected.");
    throw new FileReadError("This PDF couldn't be opened.");
  }
  const pages: string[] = [];
  let length = 0;
  for (let n = 1; n <= doc.numPages && length < MAX_FILE_CHARS; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if ("str" in item) text += item.str + (item.hasEOL ? "\n" : "");
    }
    pages.push(text.trim());
    length += text.length;
  }
  const text = pages.filter(Boolean).join("\n\n");
  // A scan has no text layer: read the first pages like photos.
  if (text.replace(/\s/g, "").length < 50 * Math.min(doc.numPages, 3)) {
    const scanned: string[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, 4); n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1600 / Math.max(viewport.width, viewport.height));
      const view = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(view.width);
      canvas.height = Math.round(view.height);
      await page.render({ canvas, viewport: view }).promise;
      scanned.push(await readImageData(canvas.toDataURL("image/jpeg", 0.85)));
    }
    return scanned.filter(Boolean).join("\n\n");
  }
  return text;
}

// --- Photos ---

async function readPhoto(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new FileReadError("This image format can't be opened here. Try JPG or PNG.");
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new FileReadError("This image couldn't be read.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return readImageData(canvas.toDataURL("image/jpeg", 0.85));
}

async function readImageData(image: string): Promise<string> {
  const { text } = await api<{ text: string }>("/api/extract", { body: { image } });
  return text;
}
