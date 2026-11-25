"use client"

/**
 * Turns any API error into a message for the user.
 *
 * Order: backend message (already in the user's language thanks to x-language)
 * → translated generic message for network / rate-limit errors → fallback.
 */

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { ApiError, messagesOf } from "@/lib/api/error"

export function useErrorText() {
  const t = useTranslations("common")
  return useCallback(
    (error: unknown, fallback?: string) => {
      if (error instanceof ApiError && error.message) return error.message
      if (typeof error === "object" && error !== null) {
        if ("data" in error) {
          const [first] = messagesOf((error as { data: unknown }).data)
          if (first) return first
        }
        const status = (error as { status?: unknown }).status
        if (status === "FETCH_ERROR") return t("network")
        if (status === 429) return t("rateLimited")
      }
      return fallback ?? t("unexpected")
    },
    [t]
  )
}
