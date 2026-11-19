export const REFRESH_SKEW_MS = 60_000

export const ROLE_HOME = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
} as const

export const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]

export const COMPLETE_PROFILE_ROUTE = "/complete-profile"
