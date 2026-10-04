import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Lets people add the site to their phone's home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: AI presentation maker`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
