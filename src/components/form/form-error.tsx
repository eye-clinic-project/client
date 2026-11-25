"use client"

/** Shows a field's validation error, translating vm() keys (see lib/i18n/validation.ts). */

import type { FieldError as HookFieldError } from "react-hook-form"

import { FieldError } from "@/components/ui/field"
import { useValidationMessage } from "@/lib/i18n/use-validation-message"

export function FormFieldError({
  error,
  className = "text-[13px]",
}: {
  error?: Pick<HookFieldError, "message">
  className?: string
}) {
  const translate = useValidationMessage()
  const message = translate(error?.message)
  if (!message) return null
  return <FieldError className={className}>{message}</FieldError>
}
