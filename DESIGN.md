# Slidezza design system

How Slidezza looks and feels. Read this before changing any UI (format from
[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)). Tokens live in
`src/app/globals.css`; slide themes in `src/lib/themes.ts`.

## Character

AI presentation maker with Italian style: calm, premium and tactile, like touching an iPhone.
Light, airy app chrome; rich, designed slides. "Riviera" palette: deep sea navy and gold on white.

## Decisions that override generic design advice

These were chosen by the founders. Skills (taste, guidelines) must not undo them:

- **Always light.** No dark theme; the site opts out of browsers' forced dark mode
  (`color-scheme: only light`). Same look on every device, like Gamma.
- **Fonts.** Geist for UI (`--font-sans`); Fraunces for headings and the wordmark
  (`--font-serif`, italic for emphasis); Marcellus (`--font-display`) and Crimson Pro
  (`--font-book`) inside slides. Don't swap brand fonts without asking.
- **Logo.** "Arco": an arched window with the sun setting over the sea (`BrandMark.tsx`).
  Wordmark "Slide" + gold "zza" (upright). Never redraw or recolour silently.
- **Emoji** are allowed as slide icons (the AI picks one per card); UI chrome uses lucide icons.
- **Italian touches** in small moments: "Ciao, Giulia!", "Grazie!", "Bravo!", "Perfetto!".

## Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#f7f8fa` | App background |
| `--surface` | `#ffffff` | Cards, panels, inputs |
| `--text` | `#0f1c2e` | Body text |
| `--muted` | `#5b6576` | Secondary text |
| `--border` | `#e2e7ee` | Hairlines |
| `--primary` | `#0b3d6b` | Primary buttons, links, focus rings |
| `--accent` | `#9a7a2c` | Small gold accents on light backgrounds (AA on white) |
| `--gold` | `#d4af37` | Gold on dark backgrounds, logo sun |
| `--brand-a` / `--brand-b` | `#082c4e` / `#1f6fa8` | Brand gradient for big surfaces |
| `--danger` | `#b42318` | Destructive actions, errors |

One accent family (navy + gold). No purple gradients, no neon glows.

## Type scale

- Page titles: Fraunces 600, `letter-spacing: -0.015em`, emphasis in Fraunces italic.
- UI: Geist 400/500/600, 15-16px base; inputs at least 16px on phones (no iOS zoom).
- Numbers in tables and stats: `font-variant-numeric: tabular-nums`.
- Use `…` (not `...`) and curly quotes in copy.

## Shape, depth and motion

- Radius: 8px buttons and inputs, 10-14px cards and menus, 18px+ sheets; pills only for chips.
- Shadows are soft and tinted navy (`rgba(6, 26, 46, …)`), never pure black.
- Motion: `--ease-out` for most, `--ease-spring` for things that pop (menus, dialogs, toasts).
  Animate only `transform` and `opacity`; respect `prefers-reduced-motion`.
- Pressed buttons scale to about 0.97 for a tactile feel.

## Slides

- 16:9 cards, sized in container units (`cqi`) so they scale anywhere; text auto-fits (`--fit`).
- Photos are never cut awkwardly: mismatched shapes show whole over a blurred copy.
- Every fact on a slide comes from the deck's sources; sources are listed under the deck.

## Layout

- Laptop: sidebar app shell; phone: top bar + bottom tabs, menus kept inside the screen.
- Respect safe areas (`env(safe-area-inset-*)`), no horizontal scrolling at any width.
