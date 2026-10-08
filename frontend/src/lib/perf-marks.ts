// Timing-only performance marks for login → shell → dashboard flows.
//
// Records `performance.mark`/`performance.measure` entries so before/after
// comparisons come from the Performance timeline instead of estimates.
// Enabled in dev or behind `VITE_PERF_MARKS=1`. Never logs tokens, emails,
// resumes, or job content — mark names and durations only.
const enabled =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.DEV || import.meta.env?.VITE_PERF_MARKS === "1")) ||
  (typeof process !== "undefined" && process.env?.VITE_PERF_MARKS === "1");

export function perfMark(name: string): void {
  if (!enabled) return;
  try {
    performance.mark(name);
  } catch {
    // Timing must never break product code.
  }
}

export function perfMeasure(label: string, startMark: string, endMark: string): void {
  if (!enabled) return;
  try {
    performance.measure(label, startMark, endMark);
    const entries = performance.getEntriesByName(label, "measure");
    const last = entries[entries.length - 1];
    if (last) {
      console.debug(`[perf] ${label}: ${last.duration.toFixed(0)}ms`);
    }
  } catch {
    // Timing must never break product code.
  }
}
