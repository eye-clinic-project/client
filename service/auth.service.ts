import { apiClient } from "./api-client"
import { clearStoredTokens, setStoredTokens } from "@/lib/api-config"
import type { AuthTokens, Me, SignUpDto, SignUpResponse } from "@/lib/api-types"

export const authService = {
  signUp: (dto: SignUpDto) =>
    apiClient<SignUpResponse>("/auth/signup", { method: "POST", body: dto }),

  async login(email: string, password: string): Promise<AuthTokens> {
    const tokens = await apiClient<AuthTokens>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    setStoredTokens(tokens)
    return tokens
  },

  resendVerification: (email: string) =>
    apiClient<{ sent: true }>("/auth/send-verify-email", { method: "POST", body: { email } }),

  verifyEmail: (email: string, otp: string) =>
    apiClient<{ verified: true }>("/auth/verify-email", { method: "POST", body: { email, otp } }),

  forgotPassword: (email: string) =>
    apiClient<{ sent: true }>("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token: string, password: string) =>
    apiClient<{ reset: true }>("/auth/reset-password", { method: "POST", body: { token, password } }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient<{ changed: true }>("/auth/change-password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  me: () => apiClient<Me>("/auth/me"),

  async logout(action: "single" | "all" = "single") {
    try {
      await apiClient("/auth/logout", { method: "POST", body: { action } })
    } catch {
      // The token may already be expired; the local session is cleared either way.
    } finally {
      clearStoredTokens()
    }
  },
}
