"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useId, useTransition } from "react"

import { directionOf } from "@/lib/i18n/language"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { languageChanged } from "@/redux/slices/ui.slice"
import { api } from "@/service/api"
import type { Language } from "@/types/api"

const NAMES: Record<Language, string> = { en: "English", ar: "العربية" }

export function useChangeLanguage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const language = useAppSelector((state) => state.ui.language)
  const [pending, startTransition] = useTransition()

  function change(next: Language) {
    if (next === language) return
    document.cookie = `language=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
    document.documentElement.dir = directionOf(next)
    dispatch(languageChanged(next))
    dispatch(api.util.resetApiState())
    startTransition(() => router.refresh())
  }

  return { language, change, pending }
}

export function LanguageSelect({ className }: { className?: string }) {
  const id = useId()
  const t = useTranslations("common")
  const { language, change, pending } = useChangeLanguage()

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[13px] text-muted-foreground",
        className
      )}
    >
      <label htmlFor={id} className="sr-only">
        {t("language")}
      </label>
      <select
        id={id}
        value={language}
        disabled={pending}
        onChange={(event) => change(event.target.value as Language)}
        className="h-9 border border-border bg-background px-2 text-[13px] text-foreground"
      >
        {(Object.keys(NAMES) as Language[]).map((value) => (
          <option key={value} value={value} lang={value}>
            {NAMES[value]}
          </option>
        ))}
      </select>
    </div>
  )
}

export function LanguageRadio() {
  const t = useTranslations("common")
  const { language, change, pending } = useChangeLanguage()
  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      className="inline-flex border border-border bg-background"
    >
      {(Object.keys(NAMES) as Language[]).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          lang={value}
          aria-checked={language === value}
          disabled={pending}
          onClick={() => change(value)}
          className={cn(
            "min-h-10 px-4 text-[13px] font-semibold",
            language === value
              ? "bg-brand-soft text-brand-strong"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {NAMES[value]}
        </button>
      ))}
    </div>
  )
}
