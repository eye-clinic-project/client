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

export function signInErrorCode(
  code: string | null | undefined
): SignInErrorCode | null {
  if (!code) return null
  return (SIGN_IN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as SignInErrorCode)
    : "unavailable"
}

export function safeCallbackUrl(
  value: string | null | undefined
): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return undefined
  return value
}
