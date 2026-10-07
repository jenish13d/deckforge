"use client";

import type PptxGenJS from "pptxgenjs";

import { imageSrc, photoFit, plainTitle, showsImage, titleParts, type CardContent } from "./cards";
import { themeStyle, type ThemeStyle } from "./themes";
import { SITE } from "@/lib/site";

// Builds an editable PowerPoint deck (16:9, 13.333 × 7.5 in) from cards. Sizes mirror
// the on-screen card, where 1% of the card width (1cqi) is 0.1333 in ≈ 9.6 pt, and
// layouts follow CardView: photo side alternates, covers put a panel over the photo,
// and text is scaled down until it fits, like on screen.

const W = 13.333;
const H = 7.5;
const PAD_X = 0.93;
const PAD_Y = 0.8;
const CQI = W / 100;
const SANS = "Arial";
const SERIF = "Georgia";

type Slide = PptxGenJS.Slide;
type Shapes = typeof PptxGenJS.prototype.ShapeType;

/** Rough height (in inches) of text in a box, to stack and centre blocks vertically. */
function textHeight(text: string, sizePt: number, widthIn: number, lineHeight = 1.25, charWidth = 0.47): number {
  if (!text) return 0;
  // ~0.47em is an average character width for Arial/Georgia text (capitals are wider).
  const charsPerLine = Math.max(6, Math.floor((widthIn * 72) / (sizePt * charWidth)));
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

/**
 * The photo already fitted to its frame, like on screen (see photoFit): cropped around
 * the upper part, or shown whole over a blurred copy. Blur comes from scaling a tiny
 * copy back up, which every browser does the same way. On covers a whole photo sits
 * at the right (`alignX`), clear of the text panel.
 */
async function framedPhoto(dataUrl: string, frameW: number, frameH: number, alignX = 0.5): Promise<string> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = dataUrl;
  });
  if (!img?.naturalWidth) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = Math.round((1600 * frameH) / frameW);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const pic = img.naturalWidth / img.naturalHeight;
  const frame = canvas.width / canvas.height;
  const fit = photoFit(pic, frame);
  const cover = (target: CanvasRenderingContext2D, w: number, h: number, focusY: number) => {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    target.drawImage(img, (w - dw) / 2, (h - dh) * (focusY / 100), dw, dh);
  };
  if (fit.mode === "cover") {
    cover(ctx, canvas.width, canvas.height, fit.focusY);
  } else {
    const tiny = document.createElement("canvas");
    tiny.width = 32;
    tiny.height = Math.max(1, Math.round(32 / frame));
    const t = tiny.getContext("2d");
    if (t) cover(t, tiny.width, tiny.height, 50);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tiny, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - dw) * alignX, (canvas.height - dh) / 2, dw, dh);
  }
  return canvas.toDataURL("image/jpeg", 0.9);
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

interface Colors {
  title: string;
  text: string;
  muted: string;
  panel: string;
}

/** Lays out one card's content as stacked blocks at `scale` (1 = on-screen size). */
function buildBlocks(card: CardContent, style: ThemeStyle, colors: Colors, x: number, w: number, shapes: Shapes, scale: number, hasPhoto: boolean, fullBleed: boolean): Block[] {
  const pt = (cqi: number) => Math.max(8, Math.round(cqi * 9.6 * scale));
  const inch = (cqi: number) => cqi * CQI * scale;
  const heading = style.serifHeadings ? SERIF : SANS;
  const body = style.serifBody ? SERIF : SANS;
  const blocks: Block[] = [];
  const add = (height: number, draw: Block["draw"], gap = inch(2.2)) => blocks.push({ height: height + gap, draw });
  const items = card.items.filter((i) => i.heading || i.text);
  const stats = card.stats.filter((st) => st.value || st.label);
  const hero = card.layout === "stats" && stats.length === 1;
  const panelBody = style.panelBody && !fullBleed;
  const boxedOnBg = panelBody && (card.layout === "columns" || card.layout === "timeline" || (card.layout === "bullets" && !hasPhoto && items.length >= 4));

  // --- Head: icon, label, title
  if (card.icon && !style.hideIcon) add(inch(4.2), (s, y) => s.addText(card.icon, { x, y, w: 1, h: inch(4.2), fontSize: pt(4.2), margin: 0 }), inch(1.2));
  if (card.eyebrow) {
    const size = pt(1.5);
    const label = card.eyebrow.toUpperCase();
    // Capitals are ~0.72em wide plus 2pt letter spacing; the box hugs the label.
    const lw = Math.min(w, (label.length * (size * 0.72 + 2)) / 72 + 0.35);
    add(size / 72 + 0.16, (s, y) => {
      if (style.tag) s.addShape(shapes.rect, { x, y, w: lw, h: size / 72 + 0.16, fill: { color: style.tag }, line: { color: style.tag } });
      s.addText(label, { x: style.tag ? x + 0.12 : x, y, w: lw, h: size / 72 + 0.16, fontFace: style.tag ? heading : body, fontSize: size, bold: !style.tag, charSpacing: 2, color: style.tag ? "FDF6E9" : style.accent, valign: "middle", margin: 0, wrap: false });
    }, inch(1.2));
  }
  if (card.layout !== "quote") {
    const size = pt(card.layout === "title" ? (fullBleed ? 5.4 : 6.6) : card.layout === "section" ? 5.6 : 4.6);
    const upper = (t: string) => (style.upperTitles ? t.toUpperCase() : t);
    const text = upper(plainTitle(card.title));
    // Highlighted words keep the slide's accent colour, as on screen.
    const runs = titleParts(card.title).map((part) => ({ text: upper(part.text), options: part.highlight ? { color: style.accent } : {} }));
    // Bold serif titles run wide (and wider still where Georgia is replaced), so allow for that.
    const th = textHeight(text, size, w, style.upperTitles ? 1.2 : 1.12, style.upperTitles ? 0.7 : 0.62);
    add(th, (s, y) => s.addText(runs, { x, y, w, h: th, fontFace: heading, fontSize: size, bold: !style.upperTitles, color: colors.title, valign: "top", margin: 0, lineSpacingMultiple: 0.95 }));
  }

  // --- Body
  const bodyBlocks: Block[] = [];
  const pad = panelBody && !boxedOnBg ? inch(3.2) : 0;
  const bx = x + pad;
  const bw = w - pad * 2;
  const addBody = (height: number, draw: Block["draw"], gap = inch(2)) => bodyBlocks.push({ height: height + gap, draw });
  const subtitleColor = boxedOnBg ? colors.title : colors.muted;
  const subtitle = (size: number) => {
    const sw = bw * 0.9;
    const sh = textHeight(card.subtitle, pt(size), sw, 1.45);
    addBody(sh, (s, y) => s.addText(card.subtitle, { x: bx, y, w: sw, h: sh, fontFace: body, fontSize: pt(size), color: subtitleColor, valign: "top", margin: 0 }));
  };

  if (card.layout === "quote") {
    const quote = `“${card.quote || plainTitle(card.title)}”`;
    const qh = textHeight(quote, pt(3.6), bw - 0.5, 1.3);
    addBody(qh, (s, y) => {
      s.addShape(shapes.rect, { x: bx, y, w: 0.08, h: qh, fill: { color: style.accent }, line: { color: style.accent } });
      s.addText(quote, { x: bx + 0.4, y, w: bw - 0.4, h: qh, fontFace: heading, fontSize: pt(3.6), color: colors.text, valign: "top", margin: 0, lineSpacingMultiple: 1.1 });
    });
    if (card.quoteAuthor) addBody(0.4, (s, y) => s.addText(`— ${card.quoteAuthor}`, { x: bx + 0.48, y, w: bw, h: 0.4, fontFace: body, fontSize: pt(1.9), color: colors.muted, margin: 0 }));
    if (card.quote && card.title) addBody(0.4, (s, y) => s.addText(plainTitle(card.title), { x: bx, y, w: bw, h: 0.4, fontFace: body, fontSize: pt(2.2), color: colors.muted, margin: 0 }));
  } else if (card.subtitle && !hero) {
    subtitle(card.layout === "title" ? 2.6 : 2.2);
  }

  if (card.layout === "title" || card.layout === "section") {
    addBody(0.06, (s, y) => s.addShape(shapes.roundRect, { x: bx, y, w: inch(10) / scale, h: 0.08, fill: { color: style.accent }, line: { color: style.accent }, rectRadius: 0.04 }));
  }

  const itemSize = pt(2.1);
  const headSize = Math.round(itemSize * 1.08);
  const box = (s: Slide, bxx: number, y: number, bww: number, h: number, fill: string) =>
    s.addShape(shapes.roundRect, { x: bxx, y, w: bww, h, fill: { color: fill }, line: { color: fill }, rectRadius: style.panelBody ? 0.03 : 0.12 });
  const boxFill = style.panelBody ? colors.panel : style.surface;

  if ((card.layout === "bullets" || card.layout === "timeline") && items.length) {
    const row = card.layout === "timeline" && !hasPhoto && items.length <= 4;
    const grid = card.layout === "bullets" && !hasPhoto && items.length >= 4;
    const boxed = grid || (card.layout === "timeline" && !row);
    if (row) {
      const gap = inch(2.6);
      const cw = (bw - gap * (items.length - 1)) / items.length;
      const step = inch(3.4);
      const h = step + 0.15 + Math.max(...items.map((i) => textHeight(i.heading, headSize, cw, 1.2) + textHeight(i.text, itemSize, cw, 1.4)));
      addBody(h, (s, y) => {
        s.addShape(shapes.rect, { x: bx + step / 2, y: y + step / 2 - 0.015, w: bw - step, h: 0.03, fill: { color: style.accent, transparency: 60 }, line: { color: style.accent, transparency: 60 } });
        items.forEach((item, n) => {
          const cx = bx + n * (cw + gap);
          s.addShape(shapes.ellipse, { x: cx, y, w: step, h: step, fill: { color: style.accent }, line: { color: style.accent } });
          s.addText(String(n + 1), { x: cx, y, w: step, h: step, align: "center", valign: "middle", fontFace: SANS, fontSize: pt(1.6), bold: true, color: style.onAccent, margin: 0 });
          const hh = textHeight(item.heading, headSize, cw, 1.2);
          if (item.heading) s.addText(item.heading, { x: cx, y: y + step + 0.15, w: cw, h: hh, fontFace: heading, fontSize: headSize, bold: true, color: colors.text, valign: "top", margin: 0 });
          if (item.text) s.addText(item.text, { x: cx, y: y + step + 0.15 + hh, w: cw, h: textHeight(item.text, itemSize, cw, 1.4), fontFace: body, fontSize: itemSize, color: colors.muted, valign: "top", margin: 0 });
        });
      });
    } else {
      const cols = grid ? 2 : 1;
      const gap = inch(1.6);
      const cw = (bw - gap * (cols - 1)) / cols;
      const indent = card.layout === "timeline" ? inch(3.4) + 0.2 : 0.35;
      const innerPad = boxed ? inch(2) : 0;
      const tw = cw - indent - innerPad * 2;
      const heights = items.map((i) => textHeight(i.heading, headSize, tw, 1.2) + textHeight(i.text, itemSize, tw, 1.4) + (boxed ? inch(1.5) * 2 : 0.05));
      for (let r = 0; r < items.length; r += cols) {
        const rowItems = items.slice(r, r + cols);
        const rh = Math.max(...heights.slice(r, r + cols));
        addBody(rh, (s, y) =>
          rowItems.forEach((item, c) => {
            const n = r + c;
            const cx = bx + c * (cw + gap);
            const ty = y + (boxed ? inch(1.5) : 0);
            if (boxed) box(s, cx, y, cw, rh, boxFill);
            if (card.layout === "timeline") {
              const step = inch(3.4);
              s.addShape(shapes.ellipse, { x: cx + innerPad, y: ty, w: step, h: step, fill: { color: style.accent }, line: { color: style.accent } });
              s.addText(String(n + 1), { x: cx + innerPad, y: ty, w: step, h: step, align: "center", valign: "middle", fontFace: SANS, fontSize: pt(1.6), bold: true, color: style.onAccent, margin: 0 });
            } else {
              s.addShape(shapes.ellipse, { x: cx + innerPad + 0.05, y: ty + 0.1, w: 0.11, h: 0.11, fill: { color: style.accent }, line: { color: style.accent } });
            }
            const tx = cx + innerPad + indent;
            const hh = textHeight(item.heading, headSize, tw, 1.2);
            if (item.heading) s.addText(item.heading, { x: tx, y: ty, w: tw, h: hh, fontFace: heading, fontSize: headSize, bold: true, color: colors.text, valign: "top", margin: 0 });
            if (item.text) s.addText(item.text, { x: tx, y: ty + hh, w: tw, h: textHeight(item.text, itemSize, tw, 1.4), fontFace: body, fontSize: itemSize, color: colors.muted, valign: "top", margin: 0 });
          }),
          inch(1.6),
        );
      }
    }
  }

  if (card.layout === "columns" && items.length) {
    const gap = inch(2);
    const cw = (bw - gap * (items.length - 1)) / items.length;
    const inner = cw - inch(2.2) * 2;
    const h = Math.max(...items.map((i) => textHeight(i.heading, headSize, inner, 1.2) + textHeight(i.text, itemSize, inner, 1.4))) + inch(2.2) * 2;
    addBody(h, (s, y) =>
      items.forEach((item, i) => {
        const cx = bx + i * (cw + gap);
        box(s, cx, y, cw, h, boxFill);
        if (!style.panelBody) s.addShape(shapes.rect, { x: cx, y, w: cw, h: 0.07, fill: { color: style.accent }, line: { color: style.accent } });
        const hh = textHeight(item.heading, headSize, inner, 1.2);
        s.addText(item.heading, { x: cx + inch(2.2), y: y + inch(2.2), w: inner, h: hh, fontFace: heading, fontSize: headSize, bold: true, color: colors.text, valign: "top", margin: 0 });
        s.addText(item.text, { x: cx + inch(2.2), y: y + inch(2.2) + hh, w: inner, h: h - hh - inch(2.2) * 2, fontFace: body, fontSize: itemSize, color: colors.muted, valign: "top", margin: 0 });
      }),
    );
  }

  if (card.layout === "stats" && stats.length) {
    if (hero) {
      const [st] = stats;
      const vs = pt(10);
      addBody((vs / 72) * 1.15, (s, y) => s.addText(st.value, { x: bx, y, w: bw, h: (vs / 72) * 1.15, fontFace: heading, fontSize: vs, bold: !style.panelBody, color: style.accent, valign: "top", margin: 0 }), inch(1.2));
      const lh = textHeight(st.label, pt(2.6), bw, 1.3);
      addBody(lh, (s, y) => s.addText(st.label, { x: bx, y, w: bw, h: lh, fontFace: heading, fontSize: pt(2.6), bold: true, color: colors.text, valign: "top", margin: 0 }), inch(1.2));
      if (card.subtitle) subtitle(2.2);
    } else {
      const cols = hasPhoto ? Math.min(2, stats.length) : stats.length;
      const gap = inch(2);
      const cw = (bw - gap * (cols - 1)) / cols;
      const inner = cw - inch(2.4) * 2;
      const h = pt(5) / 72 + 0.1 + Math.max(...stats.map((st) => textHeight(st.label, pt(1.8), inner, 1.35))) + inch(2.4) * 2;
      for (let r = 0; r < stats.length; r += cols) {
        const rowStats = stats.slice(r, r + cols);
        addBody(h, (s, y) =>
          rowStats.forEach((st, i) => {
            const cx = bx + i * (cw + gap);
            box(s, cx, y, cw, h, style.surface);
            s.addText(st.value, { x: cx + inch(2.4), y: y + inch(2.4), w: inner, h: pt(5) / 72 + 0.05, fontFace: heading, fontSize: pt(5), bold: true, color: style.accent, valign: "top", margin: 0 });
            s.addText(st.label, { x: cx + inch(2.4), y: y + inch(2.4) + pt(5) / 72 + 0.1, w: inner, h: h - pt(5) / 72 - inch(2.4) * 2, fontFace: body, fontSize: pt(1.8), color: colors.muted, valign: "top", margin: 0 });
          }),
          inch(2),
        );
      }
    }
  }

  if (card.layout === "table" && card.table.rows.length) {
    const size = pt(1.8);
    const cols = card.table.columns.length;
    const cw = bw / cols;
    const rowH = (cells: string[]) => Math.max(...cells.map((c) => textHeight(c, size, cw - 0.2, 1.3))) + 0.16;
    const heights = [rowH(card.table.columns), ...card.table.rows.map(rowH)];
    const total = heights.reduce((a, b) => a + b, 0);
    const head = style.tableHead ?? style.accent;
    addBody(total, (s, y) =>
      s.addTable(
        [
          card.table.columns.map((c) => ({ text: c, options: { bold: true, color: style.onAccent, fill: { color: head }, fontFace: heading } })),
          ...card.table.rows.map((row, r) =>
            row.map((c) => ({ text: c, options: { color: colors.text, fill: { color: r % 2 ? style.surface : colors.panel }, fontFace: body } })),
          ),
        ],
        { x: bx, y, w: bw, colW: Array(cols).fill(cw), rowH: heights, fontSize: size, valign: "middle", margin: 0.08, border: { type: "solid", pt: 0.5, color: "D9D4C7" } },
      ),
    );
  }

  // Panel themes: the body sits on a panel (except boxed lists, whose boxes are the panels).
  const bodyHeight = bodyBlocks.reduce((sum, b) => sum + b.height, 0) - (bodyBlocks.length ? inch(2) : 0);
  if (bodyBlocks.length) {
    blocks.push({
      height: bodyHeight + pad * 2,
      draw: (s, y) => {
        if (pad) box(s, x, y, w, bodyHeight + pad * 2, colors.panel);
        let by = y + pad;
        for (const b of bodyBlocks) {
          b.draw(s, by);
          by += b.height;
        }
      },
    });
  }
  return blocks;
}

const total = (blocks: Block[]) => blocks.reduce((sum, b) => sum + b.height, 0);

export async function buildPptx(cards: CardContent[], theme: string, title: string, options: { badge?: boolean } = {}): Promise<PptxGenJS> {
  const { default: Pptx } = await import("pptxgenjs");
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;
  pptx.company = SITE.name;

  const style = themeStyle(theme);
  const background = gradientBackground(style);

  for (const [index, card] of cards.entries()) {
    const slide = pptx.addSlide();
    const variant = style.variants?.[index % style.variants.length];
    slide.background = variant ? { color: variant.bg } : background ? { data: background } : { color: style.bg[0] };

    const photo = showsImage(card) ? await toDataUrl(imageSrc(card.image.url)) : null;
    const fullBleed = Boolean(photo) && (card.layout === "title" || card.layout === "section");
    const imageLeft = Boolean(photo) && !fullBleed && index % 2 === 1;

    if (photo && card.image) {
      const px = fullBleed ? 0 : imageLeft ? 0 : W * 0.56;
      const pw = fullBleed ? W : W * 0.44;
      slide.addImage({ data: await framedPhoto(photo, pw, H, fullBleed ? 0.92 : 0.5), x: px, y: 0, w: pw, h: H, altText: card.image.alt });
      if (card.image.credit) {
        slide.addText(`Photo: ${card.image.credit}`, {
          x: px, y: H - (options.badge ? 0.82 : 0.4), w: pw - 0.15, h: 0.3, align: "right", fontFace: SANS, fontSize: 9, color: "FFFFFF",
          hyperlink: card.image.creditUrl ? { url: card.image.creditUrl } : undefined, margin: 0,
        });
      }
    }

    const panel = variant?.panel ?? style.panel;
    const colors: Colors = fullBleed
      ? { title: style.panelText, text: style.panelText, muted: style.muted, panel }
      : { title: variant?.title ?? style.title ?? style.text, text: style.panelBody ? style.panelText : style.text, muted: style.muted, panel };

    // Content area
    let x = PAD_X;
    let w = W - PAD_X * 2;
    if (photo && !fullBleed) {
      w = W * 0.56 - PAD_X - 0.53;
      x = imageLeft ? W * 0.44 + 0.67 : PAD_X;
    }
    const panelPad = 0.5;
    if (fullBleed) {
      x = 0.67 + panelPad;
      w = W * 0.62 - panelPad * 2;
    }
    const room = fullBleed ? H - 1.4 - panelPad * 2 : H - PAD_Y * 2;

    // Shrink until it fits, like the on-screen auto-fit.
    let scale = 1;
    let blocks = buildBlocks(card, style, colors, x, w, pptx.ShapeType, scale, Boolean(photo), fullBleed);
    while (total(blocks) > room && scale > 0.5) {
      scale *= 0.92;
      blocks = buildBlocks(card, style, colors, x, w, pptx.ShapeType, scale, Boolean(photo), fullBleed);
    }
    const height = total(blocks) - 0.25;

    let y: number;
    if (fullBleed) {
      const ph = height + panelPad * 2;
      const py = card.layout === "title" ? H - 0.67 - ph : (H - ph) / 2;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.67, y: py, w: W * 0.62, h: ph, fill: { color: panel }, line: { color: panel }, rectRadius: 0.12 });
      y = py + panelPad;
    } else {
      y = Math.max(PAD_Y, (H - height) / 2);
    }
    for (const block of blocks) {
      block.draw(slide, y);
      y += block.height;
    }
    if (options.badge) addBadge(slide, pptx.ShapeType);
  }
  return pptx;
}

/** "Made with Slidezza" in the bottom-right corner, linking to the site. */
function addBadge(slide: PptxGenJS.Slide, shapes: typeof PptxGenJS.prototype.ShapeType) {
  const w = 1.9;
  const h = 0.32;
  const x = W - w - 0.18;
  const y = H - h - 0.18;
  slide.addShape(shapes.roundRect, { x, y, w, h, fill: { color: "082C4E", transparency: 15 }, line: { color: "FFFFFF", transparency: 65 }, rectRadius: 0.16 });
  slide.addText(
    [
      { text: "Made with ", options: { color: "FFFFFF" } },
      { text: SITE.name, options: { color: "D4AF37", bold: true } },
    ],
    { x, y, w, h, align: "center", valign: "middle", fontFace: SANS, fontSize: 9, margin: 0, hyperlink: { url: window.location.origin } },
  );
}

export async function downloadPptx(cards: CardContent[], theme: string, title: string, options: { badge?: boolean } = {}): Promise<void> {
  const pptx = await buildPptx(cards, theme, title, options);
  const safe = title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 80) || "deck";
  await pptx.writeFile({ fileName: `${safe}.pptx` });
}
