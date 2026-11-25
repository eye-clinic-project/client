"use client"

import { useTranslations } from "next-intl"

import { PageHeader } from "@/components/page/page-header"
import { ErrorState } from "@/components/page/states"
import { ClinicSection } from "@/components/settings/clinic-section"
import { LicenseSection } from "@/components/settings/license-section"
import { NotificationSection } from "@/components/settings/notification-section"
import { PreferencesSection } from "@/components/settings/preferences-section"
import { ProfileSection } from "@/components/settings/profile-section"
import { SecuritySection } from "@/components/settings/security-section"
import { SettingsNav } from "@/components/settings/settings-nav"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGetMyClinicQuery,
  useGetMyVerificationQuery,
} from "@/service/doctor.service"
import { useGetMeQuery } from "@/service/user.service"

export function DoctorSettings() {
  const t = useTranslations("settings")
  const { data: me, isError, refetch } = useGetMeQuery()
  const { data: clinic } = useGetMyClinicQuery()
  const { data: verification } = useGetMyVerificationQuery()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,820px)]">
        <SettingsNav
          items={[
            { id: "profile", label: t("profile.title") },
            { id: "clinic", label: t("clinic.title") },
            { id: "license", label: t("license.title") },
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
          {clinic ? (
            <ClinicSection clinic={clinic} />
          ) : (
            <Skeleton className="h-72 w-full rounded-none" />
          )}
          {verification && <LicenseSection verification={verification} />}
          <NotificationSection role="doctor" />
          {me && <SecuritySection email={me.email} />}
          {me && <PreferencesSection me={me} />}
        </div>
      </div>
    </div>
  )
}
