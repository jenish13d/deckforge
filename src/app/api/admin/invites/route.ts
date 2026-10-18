import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson, str, unauthorized } from "@/lib/http";
import { createInvite, revokeInvite } from "@/lib/invites";

async function admin() {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}

/** Makes an invite code: one sign-up, within 24 hours, for a 24-hour account. */
export async function POST(request: Request) {
  if (!(await admin())) return unauthorized();
  const body = await readJson(request);
  const invite = await createInvite(str(body?.note, 80));
  return Response.json({ code: invite.code, expiresAt: invite.expiresAt }, { status: 201 });
}

/** Cancels a code nobody has used yet. */
export async function DELETE(request: Request) {
  if (!(await admin())) return unauthorized();
  const body = await readJson(request);
  if (!(await revokeInvite(str(body?.id, 40)))) return jsonError("That code was already used or is gone.", 400);
  return Response.json({ ok: true });
}
