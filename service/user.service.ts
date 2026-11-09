import { apiClient } from "./api-client"
import type { ApiUser } from "@/lib/api-types"
import type { Locale } from "@/lib/i18n"

export const userService = {
  /** Saves the preferred language; the server uses it for emails and notifications. */
  setLanguage: (lang: Locale) => apiClient<ApiUser>("/users/me", { method: "PATCH", body: { lang } }),
}
