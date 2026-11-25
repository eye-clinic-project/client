/** Shared cache-tag helpers for query endpoints (see lib/query/client.ts). */

import type { TagType } from "@/lib/query/client"
import type { Paginated } from "@/types/api"

/**
 * Tags for a list response: one "LIST" tag (invalidate it to refetch the list)
 * plus one tag per item id (so updating one item refetches lists containing it).
 * Works for both paginated responses and plain arrays.
 */
export function listTags(
  type: TagType,
  result: Paginated<{ _id: string }> | { _id: string }[] | undefined
): { type: TagType; id: string }[] {
  const docs = Array.isArray(result) ? result : (result?.docs ?? [])
  return [{ type, id: "LIST" }, ...docs.map(({ _id }) => ({ type, id: _id }))]
}
