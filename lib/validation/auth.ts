import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
})

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const verifyOtpSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>
