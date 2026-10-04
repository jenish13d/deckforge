export const SITE = {
  name: "Deckforge",
  tagline: "Ideas to slides in a minute",
  description: "Describe your idea. Deckforge plans it, writes it and designs it. Then make it yours.",
  /** Shown in the footer and legal pages. Set NEXT_PUBLIC_CONTACT_EMAIL before launch. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};

/** Only allow same-site paths as post-login redirects. */
export function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/";
}
