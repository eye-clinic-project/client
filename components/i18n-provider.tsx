"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import { dictionaries, LOCALE_COOKIE, setRuntimeLocale, type Locale, type Messages } from "@/lib/i18n"

type I18nState = { locale: Locale; t: Messages; setLocale: (locale: Locale) => void }

const I18nContext = createContext<I18nState | null>(null)

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  // Keep non-React helpers (API headers, date formatting) on the same language as the UI.
  setRuntimeLocale(locale)

  const setLocale = useCallback((next: Locale) => {
    setRuntimeLocale(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    document.documentElement.dir = dictionaries[next].dir
    setLocaleState(next)
  }, [])

  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}
