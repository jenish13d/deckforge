import { ImageResponse } from "next/og";

import { BrandMark } from "@/components/BrandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone and iPad: the mark on a warm cream tile. */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf6ec" }}>
      <BrandMark size={128} />
    </div>,
    size,
  );
}
