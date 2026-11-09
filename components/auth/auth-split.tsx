"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"

/** Login-style page: brand panel on the start side, the form on the end side (stacks on phones). */
export function AuthSplit({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-svh flex-wrap">
      <section className="flex flex-[1_1_480px] flex-col justify-between gap-12 bg-brand-deep px-6 py-10 text-white sm:px-16 sm:py-14">
        <Logo inverted size={36} className="[&>span:last-child]:text-2xl" />
        <div className="flex max-w-[520px] flex-col gap-5">
          <h1 className="font-heading text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl">{t.brand.title}</h1>
          <p className="text-lg leading-relaxed text-[#C9E6E9]">{t.brand.subtitle}</p>
          <ul className="mt-2 flex flex-col gap-3.5 text-base text-[#E6F4F5]">
            {t.brand.points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <Check className="size-5 shrink-0 text-[#7FD1D9]" strokeWidth={2.5} aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-[#A9D3D7]">{t.disclaimer.short}</p>
      </section>
      <main className="relative flex flex-[1_1_520px] items-center justify-center px-6 pt-20 pb-12">
        <div className="absolute top-4 end-4 flex gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-[32px] font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
