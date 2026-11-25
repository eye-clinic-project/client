/** Server-side role guard used by the admin/doctor/patient layouts. */

import type { Session } from "next-auth"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { Role } from "@/types/api"
import type { SessionProfile } from "@/types/next-auth"

import { ROLE_HOME, SIGN_IN_ROUTE } from "./constants"

type UsableSession = Session & { profile: SessionProfile; accessToken: string }

function hasUsableSession(session: Session | null): session is UsableSession {
  return Boolean(
    session?.profile &&
    session.accessToken &&
    session.error !== "RefreshTokenError"
  )
}

/**
 * Server-side guard for a role's layout. `proxy.ts` already redirects, this
 * is the second line of defense and gives the layout the user's profile.
 *
 * - Signed out (or session expired) → `/sign-in`
 * - Signed in with another role    → that role's home
 */
export async function requireRole(role: Role): Promise<SessionProfile> {
  const session = await auth()

  if (!hasUsableSession(session)) redirect(SIGN_IN_ROUTE)

  const { profile } = session
  if (profile.role !== role) redirect(ROLE_HOME[profile.role])

  return profile
}
