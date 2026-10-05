import { SITE } from "@/lib/site";
import { BrandMark, MARK_COLORS } from "./BrandMark";

// Shared layout for link-preview images (rendered by next/og, so inline styles only).

export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "linear-gradient(135deg, #082c4e 0%, #0b3d6b 55%, #1f6fa8 100%)",
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <BrandMark size={60} colors={MARK_COLORS.dark} />
        <span style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          {SITE.name.slice(0, -3)}
          <span style={{ color: "#d4af37" }}>{SITE.name.slice(-3)}</span>
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ fontSize: 28, color: "#d4af37", letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontSize: title.length > 60 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</span>
      </div>
      <span style={{ fontSize: 28, color: "#cfdced" }}>{footer}</span>
    </div>
  );
}
