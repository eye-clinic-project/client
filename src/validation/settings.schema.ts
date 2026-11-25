import { z } from "zod"

import { vm } from "@/lib/i18n/validation"
import { newPassword, optionalText, otp, requiredText } from "./common.schema"

export const profileSchema = z.object({
  name: requiredText(100),
  city: requiredText(100),
})

export const clinicSchema = z
  .object({
    clinicName: requiredText(150),
    clinicAddress: requiredText(300),
    specialty: optionalText(100),
    bio: optionalText(2000),
    yearsOfExperience: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (Number.isInteger(Number(value)) &&
            Number(value) >= 0 &&
            Number(value) <= 80),
        vm("numberRange", { min: 0, max: 80 })
      ),
  })
  .transform((value) => ({
    clinicName: value.clinicName,
    clinicAddress: value.clinicAddress,
    specialty: value.specialty || undefined,
    bio: value.bio || undefined,
    yearsOfExperience:
      value.yearsOfExperience === ""
        ? undefined
        : Number(value.yearsOfExperience),
  }))

export const passwordChangeSchema = z
  .object({ code: otp, password: newPassword, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: vm("passwordsMismatch"),
  })

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
