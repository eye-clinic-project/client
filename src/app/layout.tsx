/**
 * Root layout (server component) — wraps every page.
 *
 * - Reads the session and locale in parallel.
 * - Sets <html lang> and dir (rtl for Arabic).
 * - Loads fonts and global CSS.
 * - Mounts NextIntlClientProvider (translations) and AppProviders
 *   (session, UI/query/chat contexts, theme, toasts).
 */

import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"

import "./globals.css"
import { auth } from "@/auth"
import { AppProviders } from "@/components/providers/app-providers"
import { directionOf, resolveLanguage } from "@/lib/i18n/language"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/** Default <title>/description; pages add their own title via pageMetadata(). */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta")
  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  const language = resolveLanguage(locale)

  return (
    <html
      lang={language}
      dir={directionOf(language)}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="bg-background text-foreground">
        <NextIntlClientProvider>
          <AppProviders session={session} language={language}>
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
