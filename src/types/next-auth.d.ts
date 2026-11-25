/**
 * Extends Auth.js types with our session fields.
 *
 * - Session (visible to the client): accessToken, profile, error, needsCity
 * - JWT (server-only cookie):       also refreshToken and pendingGoogle
 * - User (sign-in result):          carries the backend session into jwt()
 */

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

/**
 * - RefreshTokenError:  refresh token rejected → user must sign in again
 * - RefreshUnavailable: backend unreachable during refresh → retried later
 * - GoogleSignInError:  finishing a Google sign-up failed
 */
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
