/** Estimated reading time in whole minutes (200 words per minute, never below 1). */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
