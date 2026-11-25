/**
 * next-intl request config: decides locale, messages and time zone per request.
 *
 * There is no locale in the URL. Instead:
 * - locale    ← `language` cookie (en | ar), default en
 * - time zone ← `tz` cookie written by AppProviders from the browser,
 *               default Africa/Cairo
 */

import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { resolveLanguage } from "@/lib/i18n/language"

export default getRequestConfig(async () => {
  const store = await cookies()
  const locale = resolveLanguage(store.get("language")?.value)
  const messages = (await import(`./messages/${locale}/index.ts`)).default
  const timeZone = store.get("tz")?.value
  return {
    locale,
    messages,
    timeZone: timeZone && isTimeZone(timeZone) ? timeZone : "Africa/Cairo",
  }
})

/** Guards against a tampered/invalid `tz` cookie. */
function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value })
    return true
  } catch {
    return false
  }
}
