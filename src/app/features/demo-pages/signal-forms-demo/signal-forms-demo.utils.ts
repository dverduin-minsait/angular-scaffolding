/**
 * Clamps a numeric value into an inclusive range.
 *
 * Used throughout the demo to keep percentage inputs safe when values are
 * temporarily out of bounds (e.g., while the user is typing).
 */
export function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}
