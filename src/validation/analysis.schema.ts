import { z } from "zod"

import { vm } from "@/lib/i18n/validation"
import { optionalText } from "./common.schema"

export const FUNDUS_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_FUNDUS_BYTES = 10 * 1024 * 1024

export const createAnalysisSchema = z
  .object({
    patientId: z.string().min(1, vm("patientRequired")),
    eye: z.enum(["left", "right", "unknown"]),
    capturedAt: z
      .string()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        vm("dateInvalid")
      )
      .refine(
        (value) => value === "" || new Date(value) <= new Date(),
        vm("dateNotFuture")
      ),
    notes: optionalText(1000),
    image: z
      .array(z.instanceof(File))
      .min(1, vm("imageRequired"))
      .refine(
        (files) => files.every((file) => FUNDUS_TYPES.includes(file.type)),
        vm("imageType")
      )
      .refine(
        (files) => files.every((file) => file.size <= MAX_FUNDUS_BYTES),
        vm("fileTooLarge", { max: 10 })
      ),
  })
  .transform((value) => {
    const body = new FormData()
    body.set("image", value.image[0])
    body.set("patientId", value.patientId)
    body.set("eye", value.eye)
    if (value.notes) body.set("notes", value.notes)
    if (value.capturedAt)
      body.set("capturedAt", new Date(value.capturedAt).toISOString())
    return body
  })

export type CreateAnalysisInput = z.input<typeof createAnalysisSchema>

export const reviewSchema = z
  .object({
    aiResultConfirmed: z.boolean({ error: vm("agreementRequired") }).nullable(),
    confirmedLevel: z.number().int().min(0).max(4).nullable(),
    notes: optionalText(5000),
    recommendations: optionalText(5000),
    followUpDate: z
      .string()
      .refine(
        (value) => value === "" || !Number.isNaN(Date.parse(value)),
        vm("dateInvalid")
      ),
  })
  .superRefine((value, context) => {
    if (value.aiResultConfirmed === null)
      context.addIssue({
        code: "custom",
        path: ["aiResultConfirmed"],
        message: vm("agreementRequired"),
      })
    if (value.confirmedLevel === null)
      context.addIssue({
        code: "custom",
        path: ["confirmedLevel"],
        message: vm("levelRequired"),
      })
  })
  .transform((value) => ({
    aiResultConfirmed: value.aiResultConfirmed ?? false,
    confirmedLevel: (value.confirmedLevel ?? 0) as 0 | 1 | 2 | 3 | 4,
    notes: value.notes || undefined,
    recommendations: value.recommendations || undefined,
    followUpDate: value.followUpDate
      ? new Date(value.followUpDate).toISOString()
      : undefined,
  }))

export type ReviewInput = z.input<typeof reviewSchema>
