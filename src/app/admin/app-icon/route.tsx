import { ImageResponse } from "next/og";

import { BrandMark } from "@/components/BrandMark";

/** App icon for the installed dashboard (192 or 512 pixels). */
export function GET(request: Request) {
  const size = new URL(request.url).searchParams.get("size") === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf6ec" }}>
        <BrandMark size={Math.round(size * 0.7)} />
      </div>
    ),
    { width: size, height: size },
  );
}
