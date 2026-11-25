"use client"

import { LogOutIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/page/page-header"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { NotificationSection } from "@/components/settings/notification-section"
import { PreferencesSection } from "@/components/settings/preferences-section"
import { ProfileSection } from "@/components/settings/profile-section"
import { SecuritySection } from "@/components/settings/security-section"
import { SettingsNav } from "@/components/settings/settings-nav"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSignOut } from "@/hooks/use-sign-out"
import { useFormat } from "@/lib/i18n/use-labels"
import { useGetMyPatientRecordQuery } from "@/service/patient.service"
import { useGetMeQuery } from "@/service/user.service"

export function PatientSettings() {
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const format = useFormat()
  const { data: me, isError, refetch } = useGetMeQuery()
  const { data: record } = useGetMyPatientRecordQuery()
  const { signOut, pending } = useSignOut()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("leadPatient")} />
      <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,820px)]">
        <SettingsNav
          items={[
            { id: "profile", label: t("profile.title") },
            { id: "medical", label: t("medical.title") },
            { id: "notifications", label: t("notifications.title") },
            { id: "security", label: t("security.title") },
            { id: "preferences", label: t("preferences.title") },
          ]}
        />
        <div className="flex min-w-0 flex-col gap-6">
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : !me ? (
            <Skeleton className="h-72 w-full rounded-none" />
          ) : (
            <ProfileSection me={me} />
          )}
          <Panel id="medical" title={t("medical.title")} bodyClassName="gap-4">
            {record ? (
              <DetailList
                items={[
                  {
                    label: t("medical.record"),
                    value: <span dir="ltr">{record.medicalRecordNumber}</span>,
                  },
                  {
                    label: t("medical.dob"),
                    value: record.dateOfBirth
                      ? format.date(record.dateOfBirth)
                      : tc("none"),
                  },
                  {
                    label: t("medical.since"),
                    value: record.diabetesSince ?? tc("none"),
                  },
                  {
                    label: t("medical.emergency"),
                    value: record.emergencyContact || tc("none"),
                  },
                ]}
              />
            ) : (
              <Skeleton className="h-28 w-full rounded-none" />
            )}
            <p className="text-xs text-subtle">{t("medical.hint")}</p>
          </Panel>
          <NotificationSection role="patient" />
          {me && <SecuritySection email={me.email} />}
          {me && <PreferencesSection me={me} />}
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => void signOut()}
            className="h-11 gap-2 self-start rounded-none px-5 text-danger hover:text-danger"
          >
            <LogOutIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t("signOut")}
          </Button>
        </div>
      </div>
    </div>
  )
}
