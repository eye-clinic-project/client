import { z } from "zod"

import { vm } from "@/lib/i18n/validation"

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, vm("emailRequired"))
  .max(254, vm("tooLong", { max: 254 }))
  .pipe(z.email(vm("emailInvalid")))

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
export const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]

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

export const blankToUndefined = (value: string) =>
  value.trim() === "" ? undefined : value.trim()
