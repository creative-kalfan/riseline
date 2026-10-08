/**
 * Derive readable display initials from a user name or email.
 *
 * Precedence:
 * 1. Display name / full name
 * 2. Email local-part
 * 3. Safe fallback
 */

export function getInitials(name?: string | null, email?: string | null): string {
  const safeName = typeof name === "string" ? name.trim() : "";
  const safeEmail = typeof email === "string" ? email.trim() : "";

  if (safeName) {
    const parts = safeName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  }

  if (safeEmail) {
    const localPart = safeEmail.split("@")[0]?.trim() ?? "";
    if (localPart.length >= 2) {
      return localPart.slice(0, 2).toUpperCase();
    }
    if (localPart.length === 1) {
      return localPart.toUpperCase();
    }
  }

  return "??";
}
