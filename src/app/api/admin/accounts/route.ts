import { adminEmails, isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson, unauthorized } from "@/lib/http";
import { deleteAllAccountsExceptAdmins } from "@/lib/invites";
import { WIPE_CONFIRM, prelaunchOn } from "@/lib/prelaunch";

/** Before launch only: deletes every account except the admins', with their decks. Can't be undone. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return unauthorized();
  if (!prelaunchOn()) return jsonError("This only works before launch (PRELAUNCH=1).", 400);
  const body = await readJson(request);
  if (body?.confirm !== WIPE_CONFIRM) return jsonError(`Type ${WIPE_CONFIRM} to confirm.`, 400);
  return Response.json({ deleted: await deleteAllAccountsExceptAdmins(adminEmails()) });
}
