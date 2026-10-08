/**
 * Null-safe date formatters shared across the workspace.
 *
 * `new Date(badInput).toLocaleDateString()` does NOT throw — it returns the
 * literal string "Invalid Date", which is how "Untitled Resume • Invalid Date"
 * reached production. Every helper here validates with `isNaN(getTime())`
 * and falls back to "Recently updated" so an invalid date never renders.
 */

export const DATE_FALLBACK = "Recently updated";

function toValidDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatDate(dateString?: string | null): string {
  const d = toValidDate(dateString);
  if (!d) return DATE_FALLBACK;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(dateString?: string | null): string {
  const d = toValidDate(dateString);
  if (!d) return DATE_FALLBACK;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
