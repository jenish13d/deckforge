import { getCurrentUser } from "@/lib/auth";
import { billingConfigured } from "@/lib/billing";
import { db } from "@/lib/db";
import { emailEnabled, sendEmail } from "@/lib/email";
import { jsonError, unauthorized } from "@/lib/http";
import { SITE } from "@/lib/site";

// Until payments are set up, "Upgrade to Pro" puts the user on a waitlist so the
// owner can see who wants to pay (and email them when Pro opens).
export async function POST() {
  if (billingConfigured()) return jsonError("Pro is available now: use Upgrade to Pro.", 400);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.proWaitlistAt) return Response.json({ ok: true });

  await db.user.update({ where: { id: user.id }, data: { proWaitlistAt: new Date() } });

  if (emailEnabled() && SITE.contactEmail) {
    const total = await db.user.count({ where: { proWaitlistAt: { not: null } } });
    const text = `${user.email} wants to upgrade to Pro.\n\n${total} ${total === 1 ? "person is" : "people are"} on the Pro list now.`;
    sendEmail(SITE.contactEmail, `Someone wants ${SITE.name} Pro 💰`, text, `<p>${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!).replace(/\n/g, "<br>")}</p>`).catch((error) =>
      console.error("Waitlist email failed", error),
    );
  }
  return Response.json({ ok: true }, { status: 201 });
}
