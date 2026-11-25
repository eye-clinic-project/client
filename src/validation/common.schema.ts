/**
 * Reusable Zod building blocks shared by all form schemas.
 * Messages are vm() keys translated by FormFieldError (see lib/i18n/validation.ts).
 */

import { z } from "zod"

import { vm } from "@/lib/i18n/validation"

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, vm("emailRequired"))
  .max(254, vm("tooLong", { max: 254 }))
  .pipe(z.email(vm("emailInvalid")))

// Max 72 characters, matching the backend's password limit.
export const newPassword = z
  .string()
  .min(8, vm("passwordMin", { min: 8 }))
  .max(72, vm("tooLong", { max: 72 }))

export const requiredText = (max: number) =>
  z.string().trim().min(1, vm("required")).max(max, vm("tooLong", { max }))

export const optionalText = (max: number) =>
  z.string().trim().max(max, vm("tooLong", { max }))

export const otp = z.string().regex(/^\d{6}$/, vm("otp"))

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]

// Doctor license files: 1–3 PDF/image files, ≤ 10 MB each.
export const licenseDocuments = z
  .array(z.instanceof(File))
  .min(1, vm("documentsMin"))
  .max(3, vm("documentsMax", { max: 3 }))
  .refine(
    (files) => files.every((file) => DOCUMENT_TYPES.includes(file.type)),
    vm("documentType")
  )
  .refine(
    (files) => files.every((file) => file.size <= MAX_DOCUMENT_BYTES),
    vm("fileTooLarge", { max: 10 })
  )

// Empty/whitespace-only input → undefined, so optional fields are omitted from the request.
export const blankToUndefined = (value: string) =>
  value.trim() === "" ? undefined : value.trim()
