"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", icon: SunIcon, label: "themeLight" },
  { value: "dark", icon: MoonIcon, label: "themeDark" },
  { value: "system", icon: MonitorIcon, label: "themeSystem" },
] as const

const subscribe = () => () => {}

export function ThemeToggle({
  showLabels = false,
  className,
}: {
  showLabels?: boolean
  className?: string
}) {
  const t = useTranslations("common")
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const current = mounted ? (theme ?? "system") : null

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className={cn(
        "inline-flex border border-border bg-background",
        className
      )}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          aria-label={showLabels ? undefined : t(label)}
          title={t(label)}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex min-h-9 items-center justify-center gap-2 px-2.5 text-[13px] font-semibold",
            showLabels && "min-h-10 px-4",
            current === value
              ? "bg-brand-soft text-brand-strong"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {showLabels && t(label)}
        </button>
      ))}
    </div>
  )
}
