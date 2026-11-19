import "next-auth"
import "@auth/core/jwt"

import type { Language, Role } from "./api"

export interface SessionProfile {
  id: string
  role: Role
  name: string
  email: string
  avatarUrl: string | null
  emailVerified: boolean
  language: Language | null
}

export interface BackendSession {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  profile: SessionProfile
}

export interface PendingGoogleSignIn {
  idToken: string
}

export type SessionError =
  "RefreshTokenError" | "RefreshUnavailable" | "GoogleSignInError"

declare module "next-auth" {
  interface User {
    backend?: BackendSession
    pendingGoogle?: PendingGoogleSignIn
  }

  interface Session {
    accessToken?: string
    accessTokenExpiresAt?: number
    profile?: SessionProfile
    error?: SessionError
    needsCity: boolean
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends Partial<BackendSession> {
    error?: SessionError
    pendingGoogle?: PendingGoogleSignIn
  }
}
