import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { resolveLanguage } from "@/lib/i18n/language"

export default getRequestConfig(async () => {
  const store = await cookies()
  const locale = resolveLanguage(store.get("language")?.value)
  const messages = (await import(`../messages/${locale}/index.ts`)).default
  const timeZone = store.get("tz")?.value
  return {
    locale,
    messages,
    timeZone: timeZone && isTimeZone(timeZone) ? timeZone : "Africa/Cairo",
  }
})

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value })
    return true
  } catch {
    return false
  }
}
