import type { Role } from "@/types/api"

/**
 * How long before the access token expires we treat it as "about to expire"
 * and refresh it. Used by the Auth.js `jwt` callback and the client token store.
 */
export const REFRESH_SKEW_MS = 60_000

export const SIGN_IN_ROUTE = "/sign-in"

/** Google users without a city are sent here until they finish sign-up. */
export const COMPLETE_PROFILE_ROUTE = "/complete-profile"

/** Home page of each role. Every path under it belongs to that role only. */
export const ROLE_HOME = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
} as const satisfies Record<Role, string>

/** Public auth pages. Signed-in users who open them are sent to their home. */
export const AUTH_ROUTES = [
  SIGN_IN_ROUTE,
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]
