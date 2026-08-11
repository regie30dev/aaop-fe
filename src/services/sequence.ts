/**
 * Next sequential reference number in a fixed `PREFIX-#####` format.
 *
 * Scans `numbers` for the highest trailing numeric value (ignoring each entry's
 * own prefix/width), then returns `prefix` + (max + 1) zero-padded to `width`.
 * So the output format is deterministic even if stored rows used a different
 * width (e.g. existing "EMP-003" -> next "EMP-00004" at width 5). Empty input
 * yields the first number (e.g. "EMP-00001"). Shared by employee & office.
 */
export function nextSequentialNo(
  numbers: string[],
  format: { prefix: string; width: number },
): string {
  let max = 0;
  for (const no of numbers) {
    const match = no.match(/(\d+)\s*$/);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (value > max) max = value;
  }
  return `${format.prefix}${String(max + 1).padStart(format.width, "0")}`;
}
