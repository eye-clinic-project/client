import { CalendarDaysIcon, FileCheck2Icon, ScanEyeIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Logo } from "@/components/brand/logo"
import { LanguageSelect } from "@/components/language-select"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("auth.panel")
  const features = [
    { icon: ScanEyeIcon, text: t("featureDetection") },
    { icon: FileCheck2Icon, text: t("featureReports") },
    { icon: CalendarDaysIcon, text: t("featureCare") },
  ]

  return (
    <div className="flex min-h-svh flex-wrap bg-background text-foreground">
      <section className="flex min-w-0 flex-[1_1_520px] flex-col justify-between gap-12 bg-brand-panel px-6 py-10 text-white max-md:hidden sm:px-16 sm:py-14">
        <Logo tone="light" />
        <div className="flex max-w-[520px] flex-col gap-5">
          <h1 className="text-[44px] leading-[1.15] font-semibold tracking-[-0.02em]">
            {t("headline")}
          </h1>
          <p className="text-[17px] leading-relaxed text-cyan-100">
            {t("lead")}
          </p>
          <ul className="mt-2 flex flex-col gap-3.5 text-[15px] text-cyan-50">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="inline-flex size-7 flex-none items-center justify-center bg-[rgba(127,209,232,0.16)]">
                  <Icon className="size-4 text-brand-glow" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-cyan-200">{t("disclaimer")}</p>
      </section>

      <section className="flex min-w-0 flex-[1_1_520px] items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-[440px] flex-col gap-7">
          <div className="flex items-center justify-between gap-4 md:justify-end">
            <Logo size="sm" className="md:hidden" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelect />
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
