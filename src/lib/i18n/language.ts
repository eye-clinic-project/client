import type { Language } from "@/types/api"

export const LANGUAGES = ["en", "ar"] as const satisfies readonly Language[]

export function resolveLanguage(value: string | undefined | null): Language {
  return value === "ar" ? "ar" : "en"
}

export function directionOf(language: Language) {
  return language === "ar" ? "rtl" : "ltr"
}
