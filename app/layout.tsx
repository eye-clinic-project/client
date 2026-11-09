import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Geist_Mono, IBM_Plex_Sans_Arabic, Inter, Space_Grotesk } from "next/font/google"

import "./globals.css"
import { I18nProvider } from "@/components/i18n-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/hooks/use-session"
import { DEFAULT_LOCALE, dictionaries, isLocale, LOCALE_COOKIE } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
})
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

async function currentLocale() {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(saved) ? saved : DEFAULT_LOCALE
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "RetinaCare", description: dictionaries[await currentLocale()].meta.description }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await currentLocale()

  return (
    <html
      lang={locale}
      dir={dictionaries[locale].dir}
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        inter.variable,
        spaceGrotesk.variable,
        plexArabic.variable,
        fontMono.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>
            <SessionProvider>{children}</SessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
