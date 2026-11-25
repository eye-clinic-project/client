/**
 * Page <title> helper. Usage in a page.tsx:
 *   export const generateMetadata = pageMetadata("analyses")
 * The key must exist in messages/<lang>/meta.json (type-checked).
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import type en from "@/i18n/messages/en"

type MetaKey = keyof (typeof en)["meta"]

export function pageMetadata(key: MetaKey) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("meta")
    return { title: t(key) }
  }
}
