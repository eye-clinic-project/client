/**
 * Patient profile forms (doctor creating/editing a patient).
 * All inputs are strings; toProfile() converts them to the API types and drops empty values.
 */

import { z } from "zod"

import { vm } from "@/lib/i18n/validation"

import {
  blankToUndefined,
  email,
  optionalText,
  requiredText,
} from "./common.schema"

const currentYear = new Date().getFullYear()

const phone = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\+?[0-9\s-]{7,20}$/.test(value),
    vm("phone")
  )

const dateOfBirth = z
  .string()
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    vm("dateInvalid")
  )
  .refine(
    (value) => value === "" || new Date(value) <= new Date(),
    vm("dateNotFuture")
  )

const diabetesSince = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true
      const year = Number(value)
      return Number.isInteger(year) && year >= 1900 && year <= currentYear
    },
    vm("yearRange", { min: 1900, max: currentYear })
  )

// Fields shared by create and update. Email is create-only.
const profileFields = {
  name: requiredText(100),
  city: requiredText(100),
  phone,
  dateOfBirth,
  gender: z.enum(["", "male", "female"]),
  emergencyContact: optionalText(200),
  diabetesSince,
  medicalNotes: optionalText(5000),
}

type ProfileInput = z.input<z.ZodObject<typeof profileFields>>

const toProfile = (value: ProfileInput) => ({
  name: value.name.trim(),
  city: value.city.trim(),
  phone: blankToUndefined(value.phone),
  dateOfBirth: value.dateOfBirth
    ? new Date(value.dateOfBirth).toISOString()
    : undefined,
  gender: value.gender || undefined,
  emergencyContact: blankToUndefined(value.emergencyContact),
  diabetesSince: value.diabetesSince ? Number(value.diabetesSince) : undefined,
  medicalNotes: blankToUndefined(value.medicalNotes),
})

export const createPatientSchema = z
  .object({ ...profileFields, email })
  .transform((value) => ({ ...toProfile(value), email: value.email }))

export const updatePatientSchema = z.object(profileFields).transform(toProfile)

export type CreatePatientInput = z.input<typeof createPatientSchema>
export type UpdatePatientInput = z.input<typeof updatePatientSchema>

/** Default values for the create form. */
export const EMPTY_PATIENT: CreatePatientInput = {
  name: "",
  email: "",
  city: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  emergencyContact: "",
  diabetesSince: "",
  medicalNotes: "",
}
