import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone and iPad (PNG version of icon.svg on a white tile). */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
      <svg width="136" height="136" viewBox="0 0 32 32">
        <rect x="2" y="8" width="21" height="15" rx="4" fill="#d4af37" />
        <rect x="8" y="12" width="22" height="16" rx="4" fill="#0b3d6b" />
        <path d="M13.5 18h11M13.5 22h7" stroke="#fff7ea" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="26" cy="6.5" r="4" fill="#1f6fa8" />
      </svg>
    </div>,
    size,
  );
}
