import { serverApiUrl } from "@/lib/env"
import type { ApiEnvelope, Language } from "@/types/api"
import { toApiError } from "./error"

interface ServerApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  accessToken?: string
  language?: Language
}

export async function serverApi<T>(
  path: string,
  { method = "GET", body, accessToken, language = "en" }: ServerApiOptions = {}
): Promise<T> {
  const headers = new Headers({
    accept: "application/json",
    "x-language": language,
  })
  if (body !== undefined) headers.set("content-type", "application/json")
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`)

  const response = await fetch(`${serverApiUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T

  const envelope = (await response.json()) as ApiEnvelope<T>
  return envelope.data
}
