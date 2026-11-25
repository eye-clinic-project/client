import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { Role } from "@/types/api"
import type { SessionProfile } from "@/types/next-auth"
import { ROLE_HOME } from "./constants"

export async function requireRole(role: Role): Promise<SessionProfile> {
  const session = await auth()
  const profile = session?.profile
  if (
    !profile ||
    !session?.accessToken ||
    session.error === "RefreshTokenError"
  )
    redirect("/sign-in")
  if (profile.role !== role) redirect(ROLE_HOME[profile.role])
  return profile
}
