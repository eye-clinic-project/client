"use client"

/**
 * Translated Zod messages, step 2: decoding + translating (see validation.ts).
 * Unknown keys are returned as-is, which makes missing translations easy to spot.
 */

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { parseValidationMessage } from "./validation"

export function useValidationMessage() {
  const t = useTranslations("validation")
  return useCallback(
    (message: string | undefined) => {
      if (!message) return undefined
      const { key, values } = parseValidationMessage(message)
      return t.has(key as never) ? t(key as never, values as never) : message
    },
    [t]
  )
}
