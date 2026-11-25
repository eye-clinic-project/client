"use client"

/**
 * Client-side providers for the whole app, mounted once in app/layout.tsx.
 *
 * Order (outside → inside): SessionProvider → UiProvider → QueryProvider →
 * ChatProvider → ThemeProvider.
 * Also mounts SessionBridge (session ↔ tokenStore) and the toaster.
 */

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { useEffect, useState, type ReactNode } from "react"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ChatProvider } from "@/contexts/chat-context"
import { UiProvider } from "@/contexts/ui-context"
import { tokenStore } from "@/lib/auth/token-store"
import { QueryProvider } from "@/lib/query/provider"
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
  // Seed tokenStore once, before the first render of children, so the very
  // first API calls already carry the token.
  useState(() => tokenStore.sync(session))

  // Remember the browser's time zone so server-rendered dates match (i18n/request.ts).
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zone) {
      document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <UiProvider language={language}>
        <QueryProvider>
          <ChatProvider>
            <ThemeProvider>
              <SessionBridge />
              {children}
              <Toaster
                position={language === "ar" ? "top-left" : "top-right"}
                dir={language === "ar" ? "rtl" : "ltr"}
                richColors
              />
            </ThemeProvider>
          </ChatProvider>
        </QueryProvider>
      </UiProvider>
    </SessionProvider>
  )
}
