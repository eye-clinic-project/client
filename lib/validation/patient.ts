import { z } from "zod"

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient’s full name."),
  email: z.string().trim().email("Enter a valid email address."),
  patientId: z.string().trim().min(1, "Enter a patient ID."),
  age: z.coerce
    .number()
    .int("Age must be a whole number.")
    .min(1, "Enter an age between 1 and 120.")
    .max(120, "Enter an age between 1 and 120."),
})

export type CreatePatientValues = z.infer<typeof createPatientSchema>
