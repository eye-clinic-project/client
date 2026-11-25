/** Helpers for Next.js 16 page `searchParams` (a Promise of string | string[] values). */

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>

/** First value of a query param (`?a=1&a=2` → "1"). */
export function single(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
