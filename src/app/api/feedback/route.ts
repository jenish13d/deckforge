import { getCurrentUser } from "@/lib/auth";
import { CAPTCHA_ERROR, verifyCaptcha } from "@/lib/captcha";
import { db } from "@/lib/db";
import { emailEnabled, sendEmail } from "@/lib/email";
import { jsonError, readJson, str } from "@/lib/http";
import { clientKey, limits } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

export async function POST(request: Request) {
  if (!limits.feedback(clientKey(request))) return jsonError("Thanks! You've sent a lot of feedback already; try again later.", 429);

  const user = await getCurrentUser();
  const body = await readJson(request);
  const message = str(body?.message, 3000);
  const rating = Number(body?.rating);
  const page = str(body?.page, 300) || "/";
  const typedEmail = str(body?.email, 254).toLowerCase();
  if (!message) return jsonError("Write a few words first.", 400);
  // Signed-in users are already known; visitors prove they're human.
  if (!user && !(await verifyCaptcha(body?.altcha))) return jsonError(CAPTCHA_ERROR, 400);
  if (typedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedEmail)) return jsonError("That email doesn't look right.", 400);

  const feedback = await db.feedback.create({
    data: {
      userId: user?.id ?? null,
      email: user?.email ?? (typedEmail || null),
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 4 ? rating : null,
      message,
      page: page.startsWith("/") ? page : "/",
    },
  });

  // Let the owner know right away (best effort; the feedback is saved either way).
  if (emailEnabled() && SITE.contactEmail) {
    const mood = feedback.rating ? ["😞", "😐", "🙂", "😍"][feedback.rating - 1] : "–";
    const text = `New feedback ${mood}\n\nFrom: ${feedback.email ?? "anonymous"}\nPage: ${feedback.page}\n\n${message}`;
    const escaped = message.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    sendEmail(SITE.contactEmail, `New ${SITE.name} feedback ${mood}`, text, `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escaped}</pre><p>From: ${feedback.email ?? "anonymous"} · Page: ${feedback.page}</p>`).catch(
      (error) => console.error("Feedback email failed", error),
    );
  }
  return Response.json({ ok: true }, { status: 201 });
}
