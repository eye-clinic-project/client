"use client"

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { useEffect, useState, type ReactNode } from "react"
import { Provider } from "react-redux"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { tokenStore } from "@/lib/auth/token-store"
import { makeStore } from "@/redux/store"
import type { Language } from "@/types/api"
import { SessionBridge } from "./session-bridge"

interface AppProvidersProps {
  children: ReactNode
  session: Session | null
  language: Language
}

export function AppProviders({
  children,
  session,
  language,
}: AppProvidersProps) {
  const [store] = useState(() => {
    tokenStore.sync(session)
    return makeStore(language)
  })

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zone) {
      document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <Provider store={store}>
        <ThemeProvider>
          <SessionBridge />
          {children}
          <Toaster
            position={language === "ar" ? "top-left" : "top-right"}
            dir={language === "ar" ? "rtl" : "ltr"}
            richColors
          />
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  )
}
