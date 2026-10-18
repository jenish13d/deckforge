import { SITE } from "./site";

/**
 * Who can open /admin: emails in ADMIN_EMAILS or ADMIN_EMAIL (comma separated), plus the site's
 * contact email, so the owner has access without extra setup.
 */
export function adminEmails(): string[] {
  return [process.env.ADMIN_EMAILS ?? "", process.env.ADMIN_EMAIL ?? "", SITE.contactEmail]
    .join(",")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}
