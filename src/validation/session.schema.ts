import { z } from "zod"

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
})

export const profileSchema = z.object({
  _id: z.string(),
  role: z.enum(["admin", "doctor", "patient"]),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  language: z.enum(["en", "ar"]).nullable().optional(),
})

export const sessionUpdateSchema = z.union([
  z.object({
    kind: z.literal("complete-google"),
    city: z.string().trim().min(1).max(100),
  }),
  z.object({ kind: z.literal("refresh") }),
  z.object({ kind: z.literal("reload-profile") }),
])

export type SessionUpdate = z.infer<typeof sessionUpdateSchema>
