import { SITE } from "./site";

/**
 * Who can open /admin: emails in ADMIN_EMAILS (comma separated), plus the site's
 * contact email, so the owner has access without extra setup.
 */
export function isAdminEmail(email: string): boolean {
  const list = [process.env.ADMIN_EMAILS ?? "", SITE.contactEmail]
    .join(",")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
