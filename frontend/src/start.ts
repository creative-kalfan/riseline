import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { installPerformanceErrorShield } from "./lib/performance-shield";
import { initSentry } from "./lib/sentry";

// Install first: swallows the known non-critical performance-observer
// `startTime` crash (incognito) before any telemetry or hydration runs, so a
// third-party observer timeout can never interrupt React's commit phase.
installPerformanceErrorShield();

// Initialize Sentry
initSentry();

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
