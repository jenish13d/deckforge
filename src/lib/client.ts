"use client";

import { EDIT_TOKEN_HEADER } from "./edit-token-header";

const tokenKey = (deckId: string) => `deckforge:token:${deckId}`;

export function saveToken(deckId: string, token: string): void {
  try {
    localStorage.setItem(tokenKey(deckId), token);
  } catch {
    /* storage blocked: the deck can still be viewed, just not edited later */
  }
}

export function loadToken(deckId: string): string | null {
  try {
    return localStorage.getItem(tokenKey(deckId));
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.token ? { [EDIT_TOKEN_HEADER]: options.token } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
