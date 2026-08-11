/**
 * Next sequential reference number derived from a set of existing ones.
 *
 * Finds the highest numeric suffix among `numbers`, then increments it while
 * preserving that entry's prefix and zero-padding width (e.g. "EMP-001" ->
 * "EMP-002", "OFF-1008" -> "OFF-1009"). Returns `fallback` when none parse.
 * Shared by employee and office numbering.
 */
export function nextSequentialNo(numbers: string[], fallback: string): string {
  let best: { prefix: string; width: number; value: number } | null = null;
  for (const no of numbers) {
    const match = no.match(/^(.*?)(\d+)\s*$/);
    if (!match) continue;
    const value = Number.parseInt(match[2], 10);
    if (!best || value > best.value) {
      best = { prefix: match[1], width: match[2].length, value };
    }
  }
  if (!best) return fallback;
  const next = String(best.value + 1).padStart(best.width, "0");
  return `${best.prefix}${next}`;
}
