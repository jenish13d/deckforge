import "server-only";

import { headers } from "next/headers";

import { lockedFor } from "./prelaunch";

/** The visitor's country, from Vercel's edge (null when unknown, e.g. on a local run). */
export async function visitorCountry(): Promise<string | null> {
  return (await headers()).get("x-vercel-ip-country");
}

/** Whether this request's visitor sees the site before launch (see prelaunch.ts). */
export async function lockedHere(): Promise<boolean> {
  return lockedFor(await visitorCountry());
}
