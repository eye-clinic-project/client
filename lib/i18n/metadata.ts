import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import type en from "@/messages/en"

type MetaKey = keyof (typeof en)["meta"]

export function pageMetadata(key: MetaKey) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("meta")
    return { title: t(key) }
  }
}
