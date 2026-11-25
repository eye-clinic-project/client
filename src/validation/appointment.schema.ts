/** Appointment forms: doctor availability, booking, cancel/reschedule requests and decisions. */

import { z } from "zod"

import { combine } from "@/lib/dates"
import { vm } from "@/lib/i18n/validation"

import { optionalText } from "./common.schema"

/**
 * Doctor availability for one day. Inputs are strings from <input>/<select>;
 * output is the API body with ISO dates and numbers.
 */
export const availabilitySchema = z
  .object({
    date: z.string().min(1, vm("required")),
    from: z.string().min(1, vm("required")),
    to: z.string().min(1, vm("required")),
    slotMinutes: z.string(),
    breakMinutes: z.string(),
  })
  .superRefine((value, context) => {
    if (!value.date || !value.from || !value.to) return
    const start = combine(value.date, value.from)
    const end = combine(value.date, value.to)
    if (end <= start)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: vm("endAfterStart"),
      })
    else if (start < new Date())
      context.addIssue({
        code: "custom",
        path: ["from"],
        message: vm("dateFuture"),
      })
  })
  .transform((value) => ({
    startAt: combine(value.date, value.from).toISOString(),
    endAt: combine(value.date, value.to).toISOString(),
    slotMinutes: Number(value.slotMinutes),
    breakMinutes: Number(value.breakMinutes),
  }))

export type AvailabilityInput = z.input<typeof availabilitySchema>

/**
 * How many slots the availability form will create (shown as a preview).
 * Slots are separated by breaks; the last slot needs no break after it.
 */
export function countSlots(value: AvailabilityInput): number {
  if (!value.date || !value.from || !value.to) return 0
  const minutes =
    (combine(value.date, value.to).getTime() -
      combine(value.date, value.from).getTime()) /
    60_000
  const slot = Number(value.slotMinutes)
  const pause = Number(value.breakMinutes)
  if (minutes < slot || slot <= 0) return 0
  return Math.floor((minutes + pause) / (slot + pause))
}

export const decisionSchema = z.object({ note: optionalText(500) })

export const bookingSchema = z.object({
  slotId: z.string().min(1, vm("slotRequired")),
  reason: optionalText(500),
})

export const cancelRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, vm("reasonMin", { min: 3 }))
    .max(500, vm("tooLong", { max: 500 })),
})

/** A note is required when the reason is "other". */
export const rescheduleRequestSchema = z
  .object({
    slotId: z.string().min(1, vm("slotRequired")),
    reason: z.enum([
      "patient_request",
      "patient_emergency",
      "medical_follow_up",
      "other",
    ]),
    note: optionalText(500),
  })
  .superRefine((value, context) => {
    if (value.reason === "other" && !value.note)
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: vm("required"),
      })
  })
  .transform((value) => ({ ...value, note: value.note || undefined }))
