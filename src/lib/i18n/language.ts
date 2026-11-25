/** Supported UI languages and helpers to read/normalize them. */

import type { Language } from "@/types/api"

export const LANGUAGES = ["en", "ar"] as const satisfies readonly Language[]

/** Any unknown value (missing cookie, typo) falls back to English. */
export function resolveLanguage(value: string | undefined | null): Language {
  return value === "ar" ? "ar" : "en"
}

/** Text direction for <html dir> and components that need it. */
export function directionOf(language: Language) {
  return language === "ar" ? "rtl" : "ltr"
}
