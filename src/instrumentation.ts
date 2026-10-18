import type { Instrumentation } from "next";

/** Sends server errors to PostHog error tracking (when it is set up), with the route but no user details or query string. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  const { captureServerError } = await import("./lib/analytics");
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  await captureServerError(error, {
    path: request.path.split("?")[0],
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    digest,
  });
};
