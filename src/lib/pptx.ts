"use client";

import type PptxGenJS from "pptxgenjs";

import { imageSrc, showsImage, type CardContent } from "./cards";
import { themeStyle, type ThemeStyle } from "./themes";

// Builds an editable PowerPoint deck (16:9, 13.333 × 7.5 in) from cards. Sizes mirror
// the on-screen card, where 1% of the card width (1cqi) is 0.1333 in ≈ 9.6 pt.

const W = 13.333;
const H = 7.5;
const PAD_X = 0.93;
const PAD_Y = 0.8;
const pt = (cqi: number) => Math.round(cqi * 9.6);
const SANS = "Arial";
const SERIF = "Georgia";

type Slide = PptxGenJS.Slide;

/** Rough height (in inches) of text in a box, to stack and centre blocks vertically. */
function textHeight(text: string, sizePt: number, widthIn: number, lineHeight = 1.25): number {
  // ~0.47em is an average character width for Arial/Georgia text.
  const charsPerLine = Math.max(8, Math.floor((widthIn * 72) / (sizePt * 0.47)));
  const lines = text.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  return (lines * sizePt * lineHeight) / 72;
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Theme backgrounds are gradients; PowerPoint gets them as a picture. */
function gradientBackground(style: ThemeStyle): string | null {
  if (style.bg[0] === style.bg[1]) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, `#${style.bg[0]}`);
  g.addColorStop(1, `#${style.bg[1]}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A smooth gradient compresses well as JPEG and stays sharp when stretched.
  return canvas.toDataURL("image/jpeg", 0.9);
}

interface Block {
  height: number;
  draw: (slide: Slide, y: number) => void;
}

function buildBlocks(card: CardContent, style: ThemeStyle, x: number, w: number, shapes: typeof PptxGenJS.prototype.ShapeType): Block[] {
  const heading = style.serifHeadings ? SERIF : SANS;
  const body = style.serifBody ? SERIF : SANS;
  const blocks: Block[] = [];
  const gap = 0.3;
  const add = (height: number, draw: Block["draw"]) => blocks.push({ height: height + gap, draw });

  if (card.icon) {
    add(0.62, (s, y) => s.addText(card.icon, { x, y, w: 1, h: 0.62, fontSize: pt(4.5), margin: 0 }));
  }

  if (card.layout === "quote") {
    const quote = `“${card.quote || card.title}”`;
    const qh = textHeight(quote, pt(3.6), w - 0.5, 1.3);
    add(qh, (s, y) => {
      s.addShape(shapes.rect, { x, y, w: 0.08, h: qh, fill: { color: style.accent }, line: { color: style.accent } });
      s.addText(quote, { x: x + 0.4, y, w: w - 0.4, h: qh, fontFace: heading, fontSize: pt(3.6), color: style.text, valign: "top", margin: 0, lineSpacingMultiple: 1.1 });
    });
    if (card.quoteAuthor) add(0.4, (s, y) => s.addText(`— ${card.quoteAuthor}`, { x: x + 0.48, y, w, h: 0.4, fontFace: body, fontSize: pt(1.9), color: style.muted, margin: 0 }));
    if (card.quote && card.title) add(0.4, (s, y) => s.addText(card.title, { x, y, w, h: 0.4, fontFace: body, fontSize: pt(2.2), color: style.muted, margin: 0 }));
    return blocks;
  }

  const titleSize = pt(card.layout === "title" ? 6.4 : card.layout === "section" ? 5.4 : 4.4);
  const th = textHeight(card.title, titleSize, w, 1.12);
  add(th, (s, y) => s.addText(card.title, { x, y, w, h: th, fontFace: heading, fontSize: titleSize, bold: true, color: style.text, valign: "top", margin: 0, lineSpacingMultiple: 0.95 }));

  if (card.subtitle) {
    const sw = w * 0.85;
    const size = pt(card.layout === "title" ? 2.5 : 2.2);
    const sh = textHeight(card.subtitle, size, sw, 1.4);
    add(sh, (s, y) => s.addText(card.subtitle, { x, y, w: sw, h: sh, fontFace: body, fontSize: size, color: style.muted, valign: "top", margin: 0 }));
  }

  if (card.layout === "title" || card.layout === "section") {
    add(0.06, (s, y) => s.addShape(shapes.roundRect, { x, y, w: 1.33, h: 0.08, fill: { color: style.accent }, line: { color: style.accent }, rectRadius: 0.04 }));
  }

  const items = card.items.filter((i) => i.heading || i.text);
  if ((card.layout === "bullets" || card.layout === "timeline") && items.length) {
    const indent = card.layout === "timeline" ? 0.65 : 0.4;
    for (const [n, item] of items.entries()) {
      const hh = item.heading ? textHeight(item.heading, pt(2.25), w - indent, 1.2) : 0;
      const bh = item.text ? textHeight(item.text, pt(2.05), w - indent, 1.35) : 0;
      blocks.push({
        height: hh + bh + 0.22,
        draw: (s, y) => {
          if (card.layout === "timeline") {
            s.addShape(shapes.ellipse, { x, y: y + 0.02, w: 0.45, h: 0.45, fill: { color: style.accent }, line: { color: style.accent } });
            s.addText(String(n + 1), { x, y: y + 0.02, w: 0.45, h: 0.45, align: "center", valign: "middle", fontFace: SANS, fontSize: pt(1.6), bold: true, color: style.onAccent, margin: 0 });
          } else {
            s.addShape(shapes.ellipse, { x: x + 0.05, y: y + 0.12, w: 0.12, h: 0.12, fill: { color: style.accent }, line: { color: style.accent } });
          }
          if (item.heading) s.addText(item.heading, { x: x + indent, y, w: w - indent, h: hh, fontFace: heading, fontSize: pt(2.25), bold: true, color: style.text, valign: "top", margin: 0 });
          if (item.text) s.addText(item.text, { x: x + indent, y: y + hh, w: w - indent, h: bh, fontFace: body, fontSize: pt(2.05), color: style.muted, valign: "top", margin: 0 });
        },
      });
    }
  }

  if (card.layout === "columns" && items.length) {
    const colGap = 0.27;
    const cw = (w - colGap * (items.length - 1)) / items.length;
    const inner = cw - 0.6;
    const h = Math.max(...items.map((i) => textHeight(i.heading, pt(2.25), inner, 1.2) + textHeight(i.text, pt(2.05), inner, 1.35))) + 0.7;
    add(h, (s, y) =>
      items.forEach((item, i) => {
        const cx = x + i * (cw + colGap);
        s.addShape(shapes.roundRect, { x: cx, y, w: cw, h, fill: { color: style.surface }, line: { color: style.surface }, rectRadius: 0.15 });
        s.addShape(shapes.rect, { x: cx, y, w: cw, h: 0.07, fill: { color: style.accent }, line: { color: style.accent } });
        const hh = textHeight(item.heading, pt(2.25), inner, 1.2);
        s.addText(item.heading, { x: cx + 0.3, y: y + 0.3, w: inner, h: hh, fontFace: heading, fontSize: pt(2.25), bold: true, color: style.text, valign: "top", margin: 0 });
        s.addText(item.text, { x: cx + 0.3, y: y + 0.3 + hh, w: inner, h: h - hh - 0.5, fontFace: body, fontSize: pt(2.05), color: style.muted, valign: "top", margin: 0 });
      }),
    );
  }

  const stats = card.stats.filter((st) => st.value || st.label);
  if (card.layout === "stats" && stats.length) {
    const colGap = 0.27;
    const cw = (w - colGap * (stats.length - 1)) / stats.length;
    const inner = cw - 0.6;
    const h = 0.75 + Math.max(...stats.map((st) => textHeight(st.label, pt(1.8), inner, 1.35))) + 0.7;
    add(h, (s, y) =>
      stats.forEach((st, i) => {
        const cx = x + i * (cw + colGap);
        s.addShape(shapes.roundRect, { x: cx, y, w: cw, h, fill: { color: style.surface }, line: { color: style.surface }, rectRadius: 0.15 });
        s.addText(st.value, { x: cx + 0.3, y: y + 0.3, w: inner, h: 0.75, fontFace: heading, fontSize: pt(5), bold: true, color: style.accent, valign: "top", margin: 0 });
        s.addText(st.label, { x: cx + 0.3, y: y + 1.1, w: inner, h: h - 1.3, fontFace: body, fontSize: pt(1.8), color: style.muted, valign: "top", margin: 0 });
      }),
    );
  }

  return blocks;
}

export async function buildPptx(cards: CardContent[], theme: string, title: string): Promise<PptxGenJS> {
  const { default: Pptx } = await import("pptxgenjs");
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;
  pptx.company = "Deckforge";

  const style = themeStyle(theme);
  const background = gradientBackground(style);

  for (const card of cards) {
    const slide = pptx.addSlide();
    slide.background = background ? { data: background } : { color: style.bg[0] };

    const photo = showsImage(card) ? await toDataUrl(imageSrc(card.image.url)) : null;
    const contentW = photo ? W * 0.58 - PAD_X - 0.53 : W - PAD_X * 2;

    if (photo && card.image) {
      const px = W * 0.58;
      slide.addImage({ data: photo, x: px, y: 0, w: W - px, h: H, sizing: { type: "cover", w: W - px, h: H }, altText: card.image.alt });
      if (card.image.credit) {
        slide.addText(`Photo: ${card.image.credit} / Pexels`, {
          x: px, y: H - 0.4, w: W - px - 0.15, h: 0.3, align: "right", fontFace: SANS, fontSize: 9, color: "FFFFFF",
          hyperlink: card.image.creditUrl ? { url: card.image.creditUrl } : undefined, margin: 0,
        });
      }
    }

    const blocks = buildBlocks(card, style, PAD_X, contentW, pptx.ShapeType);
    const total = blocks.reduce((sum, b) => sum + b.height, 0) - 0.3;
    let y = Math.max(PAD_Y, (H - total) / 2);
    for (const block of blocks) {
      block.draw(slide, y);
      y += block.height;
    }
  }
  return pptx;
}

export async function downloadPptx(cards: CardContent[], theme: string, title: string): Promise<void> {
  const pptx = await buildPptx(cards, theme, title);
  const safe = title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 80) || "deck";
  await pptx.writeFile({ fileName: `${safe}.pptx` });
}
