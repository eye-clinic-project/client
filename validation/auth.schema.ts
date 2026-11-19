import { z } from "zod"

import { vm } from "@/lib/i18n/validation"
import {
  email,
  licenseDocuments,
  newPassword,
  optionalText,
  otp,
  requiredText,
} from "./common.schema"

export const signInSchema = z.object({
  email,
  password: z
    .string()
    .min(1, vm("passwordRequired"))
    .max(72, vm("tooLong", { max: 72 })),
})

export const signUpSchema = z
  .object({
    role: z.enum(["patient", "doctor"]),
    name: requiredText(100),
    city: requiredText(100),
    email,
    password: newPassword,
    acceptTerms: z
      .boolean()
      .refine((value) => value, { message: vm("acceptTerms") }),
    clinicName: optionalText(150),
    clinicAddress: optionalText(300),
    licenseNumber: optionalText(50),
    specialty: optionalText(100),
    documents: z.array(z.instanceof(File)),
  })
  .superRefine((value, context) => {
    if (value.role !== "doctor") return
    for (const field of [
      "clinicName",
      "clinicAddress",
      "licenseNumber",
    ] as const) {
      if (!value[field])
        context.addIssue({
          code: "custom",
          path: [field],
          message: vm("required"),
        })
    }
    const documents = licenseDocuments.safeParse(value.documents)
    if (!documents.success) {
      context.addIssue({
        code: "custom",
        path: ["documents"],
        message: documents.error.issues[0]?.message ?? vm("documentsMin"),
      })
    }
  })
  .transform(
    ({
      clinicName,
      clinicAddress,
      licenseNumber,
      specialty,
      documents,
      ...rest
    }) =>
      rest.role === "doctor"
        ? {
            account: {
              ...rest,
              clinicName,
              clinicAddress,
              licenseNumber,
              specialty: specialty || undefined,
            },
            license: { licenseNumber, documents },
          }
        : { account: rest, license: null }
  )

export const emailSchema = z.object({ email })

export const verifyEmailSchema = z.object({ email, code: otp })

export const resetPasswordSchema = z
  .object({
    email,
    code: otp,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: vm("passwordsMismatch"),
  })
  .transform(({ email, code, password }) => ({ email, code, password }))

export const completeProfileSchema = z.object({ city: requiredText(100) })

export type SignInInput = z.input<typeof signInSchema>
export type SignUpInput = z.input<typeof signUpSchema>
export type SignUpOutput = z.output<typeof signUpSchema>
export type SignUpPayload = SignUpOutput["account"]
export type EmailPayload = z.output<typeof emailSchema>
export type VerifyEmailPayload = z.output<typeof verifyEmailSchema>
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>
export type ResetPasswordPayload = z.output<typeof resetPasswordSchema>
