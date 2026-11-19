"use client"

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
