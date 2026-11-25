"use client"

/** Banner asking to enable push notifications. Only shown while the browser permission is still "default" (never asked). */

import { BellRingIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function PushPrompt() {
  const t = useTranslations("common.push")
  const tc = useTranslations("common")
  const { permission, enable } = usePushNotifications()
  const [pending, setPending] = useState(false)
  if (permission !== "default") return null

  return (
    <section
      aria-label={tc("notifications")}
      className="flex flex-wrap items-center justify-between gap-3 border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand-strong"
    >
      <span className="flex items-center gap-2.5">
        <BellRingIcon className="size-4" aria-hidden="true" />
        {t("prompt")}
      </span>
      <Button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          const enabled = await enable()
          setPending(false)
          if (enabled) toast.success(t("enabled"))
        }}
        className="h-10 rounded-none px-4 text-sm font-semibold"
      >
        {t("turnOn")}
      </Button>
    </section>
  )
}
