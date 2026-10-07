export const SITE = {
  name: "Slidezza",
  tagline: "Beautiful slides in a minute",
  description: "Describe your idea. We plan it, write it and design it, with a little Italian style. Then make it yours.",
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
