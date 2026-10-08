/**
 * Client-side shields against third-party performance-observer crashes.
 *
 * Production (incognito) throws:
 *   "Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')"
 * from inside a performance-observer timeout callback (Sentry browser tracing
 * is the only PerformanceObserver-based telemetry in the bundle — there is no
 * web-vitals / SpeedInsights dependency, import, or script tag in this repo).
 * The unhandled throw lands in React's commit phase and can leave subtrees
 * (e.g. button children) unrendered.
 *
 * Two defenses:
 *  1. `isPerformanceTelemetrySafe()` — compliance probe. Sentry tracing is
 *     only enabled when `window.performance` + `PerformanceObserver` exist and
 *     entry reads actually resolve.
 *  2. `installPerformanceErrorShield()` — global `window.onerror` /
 *     `unhandledrejection` guard that swallows ONLY the known non-critical
 *     `startTime` crash signature and chains to any pre-existing handler.
 */

export function isPerformanceTelemetrySafe(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (typeof window.PerformanceObserver === "undefined") return false;
    const perf = window.performance;
    if (!perf || typeof perf.getEntriesByName !== "function") return false;
    // Probe a real entry read: in locked-down contexts (incognito) some entry
    // buffers resolve to empty/undefined, which is exactly what crashes the
    // observer's `entry.startTime` reads downstream.
    const navigation = perf.getEntriesByName("navigation");
    if (navigation && navigation.length > 0) {
      const first = navigation[0] as PerformanceEntry | undefined;
      if (!first || typeof first.startTime !== "number") return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isStartTimeCrash(message: unknown): boolean {
  return typeof message === "string" && message.includes("reading 'startTime'");
}

export function installPerformanceErrorShield(): void {
  if (typeof window === "undefined") return;

  const previousOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isStartTimeCrash(message)) {
      // Suppress the known non-critical performance-observer crash so React
      // hydration/commit is never interrupted by telemetry.
      return true;
    }
    if (typeof previousOnError === "function") {
      return previousOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event?.reason as { message?: unknown } | null)?.message ?? event?.reason;
    if (isStartTimeCrash(reason)) {
      event.preventDefault();
    }
  });
}
