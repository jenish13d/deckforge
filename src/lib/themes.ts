export const THEMES = [
  { id: "minimal", name: "Minimal" },
  { id: "midnight", name: "Midnight" },
  { id: "ocean", name: "Ocean" },
  { id: "sunset", name: "Sunset" },
  { id: "forest", name: "Forest" },
  { id: "paper", name: "Paper" },
  { id: "amalfi", name: "Amalfi" },
  { id: "toscana", name: "Toscana" },
  { id: "milano", name: "Milano" },
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
  /** Panel behind text on full-photo slides (and every body in panel themes). */
  panel: string;
  panelText: string;
  /** Title colour when it differs from the text colour. */
  title?: string;
  /** Backgrounds that rotate from slide to slide. */
  variants?: { bg: string; title: string; panel?: string }[];
  /** Body text always sits on a panel (Milano). */
  panelBody?: boolean;
  tag?: string;
  tableHead?: string;
  upperTitles?: boolean;
  hideIcon?: boolean;
}

export const THEME_STYLES: Record<ThemeId, ThemeStyle> = {
  minimal: { bg: ["FFFFFF", "FFFFFF"], text: "1D1D22", muted: "5D5D66", accent: "0B3D6B", surface: "F3F3F6", onAccent: "FFFFFF", serifHeadings: false, serifBody: false, panel: "FFFFFF", panelText: "1D1D22" },
  midnight: { bg: ["0F1226", "1C1F3D"], text: "F1F2FF", muted: "A8ACD6", accent: "8B8CFF", surface: "252845", onAccent: "10131F", serifHeadings: false, serifBody: false, panel: "1A1E3C", panelText: "F1F2FF" },
  ocean: { bg: ["E6F6FB", "C9E8F5"], text: "0D2D3D", muted: "3E6576", accent: "0077A8", surface: "EEF8FC", onAccent: "FFFFFF", serifHeadings: false, serifBody: false, panel: "F2FAFD", panelText: "0D2D3D" },
  sunset: { bg: ["FFF3E8", "FFD9CC"], text: "3A1A12", muted: "7A4A3C", accent: "D9480F", surface: "FFF4EC", onAccent: "FFFFFF", serifHeadings: true, serifBody: false, panel: "FFF6EF", panelText: "3A1A12" },
  forest: { bg: ["13261D", "1F3A2C"], text: "EEF6EF", muted: "A9C4B2", accent: "7ED39B", surface: "26392F", onAccent: "10131F", serifHeadings: true, serifBody: false, panel: "1C3326", panelText: "EEF6EF" },
  paper: { bg: ["FBF8F1", "FBF8F1"], text: "2B2620", muted: "6E6457", accent: "8A5A2B", surface: "F1EBDD", onAccent: "FFFFFF", serifHeadings: true, serifBody: true, panel: "FBF8F1", panelText: "2B2620" },
  amalfi: { bg: ["FFFBEA", "FCEFB4"], text: "12324A", muted: "47637A", accent: "1F6FA8", surface: "FFFDF3", onAccent: "FFFFFF", serifHeadings: true, serifBody: false, panel: "FFFBEA", panelText: "12324A" },
  toscana: { bg: ["3B4724", "56622F"], text: "F8F2E4", muted: "D6D0B5", accent: "EAA95E", surface: "4A5530", onAccent: "2A2010", serifHeadings: true, serifBody: false, panel: "3B4724", panelText: "F8F2E4" },
  milano: {
    bg: ["1F3B8F", "1F3B8F"], text: "1B2A4A", muted: "4A5568", accent: "C8323C", surface: "F0E9DC", onAccent: "FFFFFF",
    serifHeadings: true, serifBody: true, panel: "FDF6E9", panelText: "1B2A4A", title: "F6B81A",
    variants: [
      { bg: "1F3B8F", title: "F6B81A" },
      { bg: "F2A900", title: "1B2A4A" },
      { bg: "F4EAD5", title: "1F3B8F", panel: "FFFAF1" },
    ],
    panelBody: true, tag: "1F8A6A", tableHead: "1F6B52", upperTitles: true, hideIcon: true,
  },
};

export function themeStyle(id: string): ThemeStyle {
  return isThemeId(id) ? THEME_STYLES[id] : THEME_STYLES.minimal;
}
