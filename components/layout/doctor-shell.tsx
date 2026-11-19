"use client"

import {
  BellIcon,
  CalendarDaysIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  ScanEyeIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { useListAnalysesQuery } from "@/service/analysis.service"
import { useListMyAppointmentsQuery } from "@/service/appointment.service"
import { useListConversationsQuery } from "@/service/chat.service"
import {
  useGetMyClinicQuery,
  useGetMyVerificationQuery,
} from "@/service/doctor.service"
import { useGetUnreadCountQuery } from "@/service/notification.service"
import type { SessionProfile } from "@/types/next-auth"
import { LicenseDraftUploader } from "./license-draft-uploader"
import { SidebarShell, type ShellNavItem } from "./sidebar-shell"

export function DoctorShell({
  profile,
  children,
}: {
  profile: SessionProfile
  children: ReactNode
}) {
  const t = useTranslations("shell")
  const tc = useTranslations("common")
  const pathname = usePathname()
  const { data: verification } = useGetMyVerificationQuery()
  const approved = verification?.status === "approved"
  const { data: clinic } = useGetMyClinicQuery()
  const { data: toReview } = useListAnalysesQuery(
    { reviewed: false, status: "completed", size: 1 },
    { skip: !approved }
  )
  const { data: requests } = useListMyAppointmentsQuery(
    { pendingRequest: true, size: 1 },
    { skip: !approved }
  )
  const { data: conversations } = useListConversationsQuery(undefined, {
    skip: !approved,
  })
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  })
  const unreadMessages =
    conversations?.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0

  const primary: ShellNavItem[] = [
    { href: "/doctor", label: t("dashboard"), icon: LayoutDashboardIcon },
    { href: "/doctor/patients", label: t("patients"), icon: UsersIcon },
    {
      href: "/doctor/analyses",
      label: t("analyses"),
      icon: ScanEyeIcon,
      badge: toReview?.count,
      badgeTone: "warning",
    },
    { href: "/doctor/reports", label: t("reports"), icon: FileTextIcon },
    {
      href: "/doctor/appointments",
      label: t("appointments"),
      icon: CalendarDaysIcon,
      badge: requests?.count,
    },
    {
      href: "/doctor/messages",
      label: t("messages"),
      icon: MessageSquareIcon,
      badge: unreadMessages,
    },
  ]
  const secondary: ShellNavItem[] = [
    {
      href: "/doctor/notifications",
      label: t("notifications"),
      icon: BellIcon,
      badge: unread?.unreadCount,
    },
    { href: "/doctor/settings", label: t("settings"), icon: SettingsIcon },
  ]

  const showBanner =
    verification && !approved && pathname !== "/doctor/verification"
  const banner = showBanner ? (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
    >
      <span className="flex items-center gap-2.5">
        <ShieldAlertIcon className="size-4 shrink-0" aria-hidden="true" />
        {verification.status === "rejected"
          ? verification.rejectionReason
            ? t("banner.rejectedReason", {
                reason: verification.rejectionReason,
              })
            : t("banner.rejected")
          : verification.submittedAt
            ? t("banner.pending")
            : t("banner.missing")}
      </span>
      <Link
        href="/doctor/verification"
        className="font-semibold underline underline-offset-4"
      >
        {verification.submittedAt ? t("banner.view") : t("banner.verify")}
      </Link>
    </div>
  ) : null

  return (
    <SidebarShell
      home="/doctor"
      primary={primary}
      secondary={secondary}
      user={{
        name: tc("doctorName", { name: profile.name }),
        subtitle: clinic?.clinicName ?? profile.email,
        avatarUrl: profile.avatarUrl,
      }}
      banner={banner}
    >
      <LicenseDraftUploader email={profile.email} verification={verification} />
      {children}
    </SidebarShell>
  )
}
