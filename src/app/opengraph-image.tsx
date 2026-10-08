import { ImageResponse } from "next/og";

import { OG_SIZE, OgCard } from "@/components/OgCard";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: AI presentation maker`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <OgCard eyebrow="AI presentation maker" title="Beautiful slides from your idea" footer="Describe your idea. We plan it, write it and design it." />,
    size,
  );
}
