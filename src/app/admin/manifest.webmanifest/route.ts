import { SITE } from "@/lib/site";

/** Lets the owner install the dashboard as its own app (Edge or Chrome: Apps → Install). */
export function GET() {
  return Response.json(
    {
      name: `${SITE.name} Marketing Hub`,
      short_name: "Hub",
      description: "Sign-ups, leads and today's to-do list for the owner.",
      id: "/admin",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#f7f8fa",
      theme_color: "#0b3d6b",
      icons: [
        { src: "/admin/app-icon?size=192", sizes: "192x192", type: "image/png" },
        { src: "/admin/app-icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
