/** Helpers for the sign-in page: known error codes and safe redirect targets. */

/**
 * Codes the sign-in page knows how to explain. Ours come from auth.ts
 * (BackendSignInError / googleErrorCode); the last three are Auth.js's own.
 */
export const SIGN_IN_ERROR_CODES = [
  "invalid",
  "unverified",
  "disabled",
  "rate_limited",
  "unavailable",
  "google_conflict",
  "google_unverified_email",
  "google_invalid",
  "google_unavailable",
  "AccessDenied",
  "OAuthCallbackError",
  "Configuration",
] as const

export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[number]

/** Unknown codes are shown as the generic "unavailable" message. */
export function signInErrorCode(
  code: string | null | undefined
): SignInErrorCode | null {
  if (!code) return null
  return (SIGN_IN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as SignInErrorCode)
    : "unavailable"
}

/**
 * Only allow same-site paths as a post-sign-in redirect ("/x", not "//evil.com"
 * or "https://…"), to prevent open-redirect attacks.
 */
export function safeCallbackUrl(
  value: string | null | undefined
): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return undefined
  return value
}
