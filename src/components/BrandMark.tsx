/**
 * The Slidezza mark, "Arco": an arched Italian window with the sun setting over the sea.
 * Colors are passed in so the same drawing works on the site (CSS tokens) and in
 * generated images (plain hex, since next/og has no CSS variables).
 */
export interface MarkColors {
  sky: string;
  sun: string;
  sea: string;
  foam: string;
  wave: string;
}

export const MARK_COLORS: Record<"light" | "dark", MarkColors> = {
  light: { sky: "#0b3d6b", sun: "#d4af37", sea: "#1f6fa8", foam: "#fbf6ec", wave: "#8fc1e6" },
  // On navy backgrounds the sky turns cream so the arch stands out.
  dark: { sky: "#fbf6ec", sun: "#d4af37", sea: "#1f6fa8", foam: "#ffffff", wave: "#8fc1e6" },
};

export const MARK_VIEWBOX = "6 4 52 56";

export function BrandMark({ size = 28, colors = MARK_COLORS.light }: { size?: number; colors?: MarkColors }) {
  const wave = { fill: "none", strokeWidth: 2.4, strokeLinecap: "round" } as const;
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden="true">
      <path d="M12 58V27a20 20 0 0 1 40 0v31z" style={{ fill: colors.sky }} />
      <path d="M22 41a10 10 0 0 1 20 0z" style={{ fill: colors.sun }} />
      <rect x="12" y="41" width="40" height="17" style={{ fill: colors.sea }} />
      <path d="M13.5 47.5q4.25-2.6 8.5 0t10 0t10 0t8.5 0" style={{ ...wave, stroke: colors.foam }} />
      <path d="M17 53.5q5-2.6 10 0t10 0t10 0" style={{ ...wave, stroke: colors.wave }} />
    </svg>
  );
}
