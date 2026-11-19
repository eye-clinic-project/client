import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"

import { tokenStore } from "@/lib/auth/token-store"
import { publicEnv } from "@/lib/env"
import type { Language } from "@/types/api"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: publicEnv.apiUrl,
  prepareHeaders(headers, { getState }) {
    const token = tokenStore.get()
    if (token && !headers.has("authorization"))
      headers.set("authorization", `Bearer ${token}`)
    const language =
      (getState() as { ui?: { language?: Language } }).ui?.language ?? "en"
    headers.set("x-language", language)
    return headers
  },
})

function unwrap(data: unknown): unknown {
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    "message" in data
  ) {
    return (data as { data: unknown }).data
  }
  return data
}

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await tokenStore.ensureFresh()
  const sentWith = tokenStore.get()
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401 && sentWith) {
    const refreshed =
      tokenStore.get() !== sentWith || (await tokenStore.forceRefresh())
    if (refreshed) result = await rawBaseQuery(args, api, extraOptions)
  }

  if (result.error) return { error: result.error, meta: result.meta }
  return { data: unwrap(result.data), meta: result.meta }
}

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Me",
    "Analysis",
    "AiHealth",
    "Appointment",
    "Report",
    "Notification",
    "Doctor",
    "DoctorVerification",
    "Patient",
    "Conversation",
    "Message",
    "AdminDoctor",
    "Review",
    "Slot",
  ],
  endpoints: () => ({}),
})
