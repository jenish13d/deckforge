import { challengeResponse } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return challengeResponse(request);
}
