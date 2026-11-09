import { ar } from "./ar"
import { en, type Messages } from "./en"

export type { Messages }
export type Locale = "en" | "ar"

export const LOCALES: Locale[] = ["en", "ar"]
export const DEFAULT_LOCALE: Locale = "en"
/** Cookie that remembers the UI language; read by the root layout for the first render. */
export const LOCALE_COOKIE = "rc_lang"

export const dictionaries: Record<Locale, Messages> = { en, ar }

export const isLocale = (value: unknown): value is Locale => value === "en" || value === "ar"

/** Intl locale for dates and numbers. Arabic keeps Western digits so IDs, times and doses read the same. */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB")

/*
 * The active locale for code outside React (API client headers, date helpers).
 * Set by LocaleProvider on the client.
 */
let current: Locale = DEFAULT_LOCALE
export const setRuntimeLocale = (locale: Locale) => {
  current = locale
}
export const getLocale = () => current
export const messages = () => dictionaries[current]
