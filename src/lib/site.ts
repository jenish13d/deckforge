export const SITE = {
  name: "Slidezza",
  tagline: "Beautiful slides in a minute",
  description: "Describe your idea. We plan it, write it and design it, with a little Italian style. Then make it yours.",
  /** For search results and AI assistants: plain words people search for. */
  seoDescription:
    "Slidezza is an AI presentation maker. Turn a topic, notes, PDF, Word or PowerPoint file into researched, designed slides in a minute, with sources listed and numbers checked. Free to start.",
  /** Shown in the footer and legal pages. Set NEXT_PUBLIC_CONTACT_EMAIL before launch. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  /** Shown on the "Made with" closing slide. Set NEXT_PUBLIC_SITE_DOMAIN when a custom domain is live. */
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "slidezza.vercel.app",
};

/** Only allow same-site paths as post-login redirects. */
export function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/";
}
