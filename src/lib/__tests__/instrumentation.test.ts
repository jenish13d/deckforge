import { afterEach, describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("../analytics", () => ({ captureServerError: capture }));

import { onRequestError } from "../../instrumentation";

const context = { routerKind: "App Router", routePath: "/api/decks/[id]", routeType: "route", renderSource: undefined, revalidateReason: undefined } as never;

describe("server error reporting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    capture.mockClear();
  });

  it("sends the route and path without the query string or headers", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const error = Object.assign(new Error("boom"), { digest: "123" });
    await onRequestError(error, { path: "/api/decks/abc?token=secret", method: "GET", headers: { cookie: "session=x" } }, context);
    expect(capture).toHaveBeenCalledWith(error, { path: "/api/decks/abc", method: "GET", route: "/api/decks/[id]", routeType: "route", digest: "123" });
  });

  it("does nothing without a key or outside Node.js", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    await onRequestError(new Error("x"), { path: "/", method: "GET", headers: {} }, context);
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    await onRequestError(new Error("x"), { path: "/", method: "GET", headers: {} }, context);
    expect(capture).not.toHaveBeenCalled();
  });
});
