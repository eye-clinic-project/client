"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Panel } from "@/components/page/panel"
import { Switch } from "@/components/ui/switch"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { SettingsRow } from "./settings-row"

export function NotificationSection({ role }: { role: "doctor" | "patient" }) {
  const t = useTranslations("settings.notifications")
  const { permission, subscribed, enable, disable } = usePushNotifications()
  const [pending, setPending] = useState(false)
  const unsupported = permission === "unsupported"
  const blocked = permission === "denied"

  return (
    <Panel id="notifications" title={t("title")} bodyClassName="py-1">
      <SettingsRow
        title={t("push")}
        hint={
          unsupported
            ? t("unsupported")
            : blocked
              ? t("blocked")
              : role === "doctor"
                ? t("pushHintDoctor")
                : t("pushHintPatient")
        }
      >
        <Switch
          aria-label={t("push")}
          checked={permission === "granted" && subscribed}
          disabled={unsupported || blocked || pending}
          onCheckedChange={async (checked) => {
            setPending(true)
            if (checked) {
              const ok = await enable()
              if (ok) toast.success(t("enabled"))
            } else {
              await disable()
              toast.success(t("disabled"))
            }
            setPending(false)
          }}
        />
      </SettingsRow>
      <p className="py-3 text-xs text-subtle">{t("inbox")}</p>
    </Panel>
  )
}
