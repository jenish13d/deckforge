export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const unauthorized = () => jsonError("Please log in.", 401);
export const forbidden = () => jsonError("You don't have access to this deck.", 403);
