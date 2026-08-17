/**
 * Formats a middle name: a single-letter initial (e.g. "S") gets a trailing
 * period ("S."). Full middle names and initials that already end in "." are
 * left unchanged. Handles multiple initials too ("S J" -> "S. J.").
 */
export function formatMiddleName(middle?: string | null): string {
  return (middle ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (/^[A-Za-z]$/.test(token) ? `${token}.` : token))
    .join(" ");
}

/** Joins first / middle / last into a full name, periodizing an abbreviated middle. */
export function composeFullName(parts: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}): string {
  return [parts.firstName, formatMiddleName(parts.middleName), parts.lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
