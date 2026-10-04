export const THEMES = [
  { id: "minimal", name: "Minimal" },
  { id: "midnight", name: "Midnight" },
  { id: "ocean", name: "Ocean" },
  { id: "sunset", name: "Sunset" },
  { id: "forest", name: "Forest" },
  { id: "paper", name: "Paper" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/** Theme colors for exports (PowerPoint). Mirrors the CSS variables in globals.css. */
export interface ThemeStyle {
  bg: [string, string];
  text: string;
  muted: string;
  accent: string;
  surface: string;
  onAccent: string;
  serifHeadings: boolean;
  serifBody: boolean;
}

export const THEME_STYLES: Record<ThemeId, ThemeStyle> = {
  minimal: { bg: ["FFFFFF", "FFFFFF"], text: "1D1D22", muted: "5D5D66", accent: "4F46E5", surface: "F3F3F6", onAccent: "FFFFFF", serifHeadings: false, serifBody: false },
  midnight: { bg: ["0F1226", "1C1F3D"], text: "F1F2FF", muted: "A8ACD6", accent: "8B8CFF", surface: "252845", onAccent: "10131F", serifHeadings: false, serifBody: false },
  ocean: { bg: ["E6F6FB", "C9E8F5"], text: "0D2D3D", muted: "3E6576", accent: "0077A8", surface: "EEF8FC", onAccent: "FFFFFF", serifHeadings: false, serifBody: false },
  sunset: { bg: ["FFF3E8", "FFD9CC"], text: "3A1A12", muted: "7A4A3C", accent: "D9480F", surface: "FFF4EC", onAccent: "FFFFFF", serifHeadings: true, serifBody: false },
  forest: { bg: ["13261D", "1F3A2C"], text: "EEF6EF", muted: "A9C4B2", accent: "7ED39B", surface: "26392F", onAccent: "10131F", serifHeadings: true, serifBody: false },
  paper: { bg: ["FBF8F1", "FBF8F1"], text: "2B2620", muted: "6E6457", accent: "8A5A2B", surface: "F1EBDD", onAccent: "FFFFFF", serifHeadings: true, serifBody: true },
};

export function themeStyle(id: string): ThemeStyle {
  return isThemeId(id) ? THEME_STYLES[id] : THEME_STYLES.minimal;
}
