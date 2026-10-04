import { SITE } from "@/lib/site";

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
        <svg width="56" height="56" viewBox="0 0 32 32">
          <rect x="2" y="8" width="21" height="15" rx="4" fill="#d4af37" />
          <rect x="8" y="12" width="22" height="16" rx="4" fill="#ffffff" />
          <path d="M13.5 18h11M13.5 22h7" stroke="#0b3d6b" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="26" cy="6.5" r="4" fill="#6aa8e0" />
        </svg>
        <span style={{ fontSize: 40, fontWeight: 700 }}>{SITE.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <span style={{ fontSize: 28, color: "#d4af37", letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontSize: title.length > 60 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</span>
      </div>
      <span style={{ fontSize: 28, color: "#cfdced" }}>{footer}</span>
    </div>
  );
}
