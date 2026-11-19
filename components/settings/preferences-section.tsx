"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"

import { LanguageRadio, useChangeLanguage } from "@/components/language-select"
import { Panel } from "@/components/page/panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUpdateMeMutation } from "@/service/user.service"
import type { User } from "@/types/api"
import { SettingsRow } from "./settings-row"

export function PreferencesSection({ me }: { me: User }) {
  const t = useTranslations("settings.preferences")
  const { language } = useChangeLanguage()
  const [updateMe] = useUpdateMeMutation()
  const saved = useRef(me.language)

  useEffect(() => {
    if (saved.current === language) return
    saved.current = language
    void updateMe({ language })
  }, [language, updateMe])

  return (
    <Panel id="preferences" title={t("title")} bodyClassName="py-1">
      <SettingsRow title={t("language")} hint={t("languageHint")}>
        <LanguageRadio />
      </SettingsRow>
      <SettingsRow title={t("theme")} hint={t("themeHint")}>
        <ThemeToggle showLabels />
      </SettingsRow>
    </Panel>
  )
}
