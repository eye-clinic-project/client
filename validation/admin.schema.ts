import { z } from "zod"

import { vm } from "@/lib/i18n/validation"

export const rejectDoctorSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, vm("reasonMin", { min: 3 }))
    .max(500, vm("tooLong", { max: 500 })),
})
