"use client"

import { useI18n } from "@/components/i18n-provider"
import { ButtonLink, Logo } from "@/components/rc/ui"

export default function NotFound() {
  const { t } = useI18n()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <h1 className="font-heading text-3xl font-semibold">{t.notFound.title}</h1>
      <p className="max-w-md text-muted-foreground">{t.notFound.body}</p>
      <ButtonLink href="/">{t.notFound.home}</ButtonLink>
    </main>
  )
}
