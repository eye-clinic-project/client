import NextAuth, { CredentialsSignin } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { cookies } from "next/headers"

import { ApiError } from "@/lib/api/error"
import { serverApi } from "@/lib/api/server-api"
import { REFRESH_SKEW_MS } from "@/lib/auth/constants"
import { rotateRefreshToken } from "@/lib/auth/rotate"
import { accessTokenExpiry } from "@/lib/auth/token-expiry"
import type { Language, TokenPair } from "@/types/api"
import type { BackendSession, SessionProfile } from "@/types/next-auth"
import { signInSchema } from "@/validation/auth.schema"
import {
  profileSchema,
  sessionUpdateSchema,
  tokenPairSchema,
} from "@/validation/session.schema"

const CITY_REQUIRED = "City is required to create an account"
const REFRESH_TTL_SECONDS = 15 * 24 * 60 * 60

export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
)

class BackendSignInError extends CredentialsSignin {
  constructor(code: string) {
    super()
    this.code = code
  }
}

async function requestLanguage(): Promise<Language> {
  try {
    return (await cookies()).get("language")?.value === "ar" ? "ar" : "en"
  } catch {
    return "en"
  }
}

async function loadProfile(
  accessToken: string,
  language: Language
): Promise<SessionProfile> {
  const user = profileSchema.parse(
    await serverApi("/user/me", { accessToken, language })
  )
  return {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    emailVerified: user.emailVerified ?? true,
    language: user.language ?? null,
  }
}

function tokenFields(pair: TokenPair) {
  const tokens = tokenPairSchema.parse(pair)
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: accessTokenExpiry(
      tokens.accessToken,
      tokens.expiresIn
    ),
  }
}

async function openSession(
  pair: TokenPair,
  language: Language
): Promise<BackendSession> {
  const tokens = tokenFields(pair)
  return { ...tokens, profile: await loadProfile(tokens.accessToken, language) }
}

function exchangeGoogle(idToken: string, city?: string): Promise<TokenPair> {
  return serverApi<TokenPair>("/authentication/google", {
    method: "POST",
    body: city ? { idToken, city } : { idToken },
    language: "en",
  })
}

function credentialsErrorCode(error: unknown): string {
  if (!(error instanceof ApiError)) return "unavailable"
  switch (error.status) {
    case 409:
      return "unverified"
    case 403:
      return "disabled"
    case 429:
      return "rate_limited"
    case 400:
    case 401:
    case 404:
      return "invalid"
    default:
      return "unavailable"
  }
}

function googleErrorCode(error: unknown): string {
  if (!(error instanceof ApiError)) return "google_unavailable"
  switch (error.status) {
    case 409:
      return "google_conflict"
    case 403:
      return error.message.startsWith("Verify your email")
        ? "google_unverified_email"
        : "disabled"
    case 401:
      return "google_invalid"
    case 429:
      return "rate_limited"
    default:
      return "google_unavailable"
  }
}

async function refreshSession(token: JWT): Promise<JWT> {
  if (!token.refreshToken)
    return { profile: token.profile, error: "RefreshTokenError" }
  try {
    const pair = await rotateRefreshToken(token.refreshToken)
    return { ...token, ...tokenFields(pair), error: undefined }
  } catch (error) {
    if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
      return { profile: token.profile, error: "RefreshTokenError" }
    }
    return { ...token, error: "RefreshUnavailable" }
  }
}

async function applyUpdate(token: JWT, data: unknown): Promise<JWT | null> {
  const update = sessionUpdateSchema.safeParse(data)
  if (!update.success) return null

  switch (update.data.kind) {
    case "complete-google": {
      if (!token.pendingGoogle) return token
      try {
        const pair = await exchangeGoogle(
          token.pendingGoogle.idToken,
          update.data.city
        )
        return { ...(await openSession(pair, await requestLanguage())) }
      } catch {
        return { error: "GoogleSignInError" }
      }
    }
    case "refresh":
      return refreshSession(token)
    case "reload-profile": {
      if (!token.accessToken) return token
      try {
        return {
          ...token,
          profile: await loadProfile(
            token.accessToken,
            await requestLanguage()
          ),
        }
      } catch {
        return token
      }
    }
  }
}

async function revokeOnServer(token: JWT | null | undefined) {
  if (!token?.refreshToken) return
  try {
    let { accessToken, refreshToken } = token
    if (
      !accessToken ||
      !token.accessTokenExpiresAt ||
      Date.now() > token.accessTokenExpiresAt - 5_000
    ) {
      const pair = await rotateRefreshToken(refreshToken)
      accessToken = pair.accessToken
      refreshToken = pair.refreshToken
    }
    await serverApi("/authentication/logout", {
      method: "POST",
      accessToken,
      body: { type: "single", refreshToken },
    })
  } catch {}
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: REFRESH_TTL_SECONDS },
  pages: { signIn: "/sign-in", error: "/sign-in" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) throw new BackendSignInError("invalid")
        const language = await requestLanguage()
        try {
          const pair = await serverApi<TokenPair>("/authentication/sign-in", {
            method: "POST",
            body: parsed.data,
            language,
          })
          const backend = await openSession(pair, language)
          return {
            id: backend.profile.id,
            name: backend.profile.name,
            email: backend.profile.email,
            backend,
          }
        } catch (error) {
          throw new BackendSignInError(credentialsErrorCode(error))
        }
      },
    }),
    ...(googleEnabled
      ? [Google({ authorization: { params: { prompt: "select_account" } } })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true
      if (!account.id_token) return "/sign-in?error=google_invalid"
      try {
        const pair = await exchangeGoogle(account.id_token)
        user.backend = await openSession(pair, await requestLanguage())
        return true
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 400 &&
          error.message === CITY_REQUIRED
        ) {
          user.pendingGoogle = { idToken: account.id_token }
          return true
        }
        return `/sign-in?error=${googleErrorCode(error)}`
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.backend) return { ...user.backend }
      if (user?.pendingGoogle) return { pendingGoogle: user.pendingGoogle }

      if (trigger === "update") {
        const updated = await applyUpdate(token, session)
        if (updated) return updated
      }

      if (!token.accessToken || !token.accessTokenExpiresAt) return token
      if (Date.now() < token.accessTokenExpiresAt - REFRESH_SKEW_MS)
        return token
      return refreshSession(token)
    },
    session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        profile: token.profile,
        error: token.error,
        needsCity: Boolean(token.pendingGoogle),
      }
    },
  },
  events: {
    async signOut(message) {
      await revokeOnServer("token" in message ? message.token : null)
    },
  },
})
