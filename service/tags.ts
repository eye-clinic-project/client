import type { Paginated } from "@/types/api"

type Tag<T extends string> = { type: T; id: string }

export function listTags<T extends string>(
  type: T,
  result: Paginated<{ _id: string }> | { _id: string }[] | undefined
): Tag<T>[] {
  const docs = Array.isArray(result) ? result : (result?.docs ?? [])
  return [{ type, id: "LIST" }, ...docs.map(({ _id }) => ({ type, id: _id }))]
}
