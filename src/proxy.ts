import { NextResponse, type NextRequest } from "next/server";

import { openBeforeLaunch, prelaunchOn } from "./lib/prelaunch";

/**
 * Before launch (PRELAUNCH=1), visitors who aren't signed in only see the launching-soon home
 * page, sign-in, legal pages and shared decks; any other page sends them to the home page.
 * Signed-in admins and invite accounts see everything (pages check the account themselves).
 */
export function proxy(request: NextRequest) {
  if (!prelaunchOn() || request.cookies.has("df_session")) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (openBeforeLaunch(pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url), 307);
}

export const config = {
  // Not for files (images, fonts, scripts), which are never pages.
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
