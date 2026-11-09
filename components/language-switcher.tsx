"use client"

import { Languages } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { useSession } from "@/hooks/use-session"
import { userService } from "@/service/user.service"
import { cn } from "@/lib/utils"

/** Toggles English ⇄ Arabic and saves the choice on the account, so emails use it too. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n()
  const { me } = useSession()
  const next = locale === "en" ? "ar" : "en"

  return (
    <button
      type="button"
      lang={next}
      aria-label={t.common.switchLanguageLabel}
      onClick={() => {
        setLocale(next)
        if (me) void userService.setLanguage(next).catch(() => null)
      }}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[10px] border border-input bg-card px-3 text-sm font-semibold hover:bg-muted",
        className,
      )}
    >
      <Languages className="size-4" aria-hidden="true" />
      {t.common.switchLanguage}
    </button>
  )
}
