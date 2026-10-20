import { z } from "zod"

export const profileSettingsSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
})

export const passwordSettingsSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  })

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>
export type PasswordSettingsValues = z.infer<typeof passwordSettingsSchema>
