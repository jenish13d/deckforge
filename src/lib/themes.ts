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
