"use client"

/**
 * Doctor frame: SidebarShell with doctor navigation, badges, and the license
 * verification gate (unapproved doctors only see a few pages + a status banner).
 */

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
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, type ReactNode } from "react"

import { useListAnalysesQuery } from "@/services/analysis.service"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"
import { useListConversationsQuery } from "@/services/chat.service"
import {
  useGetMyClinicQuery,
  useGetMyVerificationQuery,
} from "@/services/doctor.service"
import { useGetUnreadCountQuery } from "@/services/notification.service"
import type { SessionProfile } from "@/types/next-auth"

import { LicenseDraftUploader } from "./license-draft-uploader"
import { SidebarShell, type ShellNavItem } from "./sidebar-shell"

const VERIFICATION_ROUTE = "/doctor/verification"
// Pages a doctor can open before an admin approves the license. Everything else
// needs approval: the server answers 403 there.
const PENDING_ROUTES = [
  VERIFICATION_ROUTE,
  "/doctor/settings",
  "/doctor/notifications",
]

function openWhilePending(pathname: string) {
  return (
    pathname === "/doctor" ||
    PENDING_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  )
}

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
  const router = useRouter()
  const { data: verification, isError: verificationFailed } =
    useGetMyVerificationQuery()
  const approved = verification?.status === "approved"
  // Until the verification status is known, treat the doctor as pending so
  // approval-only pages don't render and fire requests that will be refused.
  const locked = !approved && !verificationFailed
  const blocked = locked && !openWhilePending(pathname)

  // Opened a locked page: send the doctor to the verification page.
  useEffect(() => {
    if (blocked && verification) router.replace(VERIFICATION_ROUTE)
  }, [blocked, router, verification])
  const { data: clinic } = useGetMyClinicQuery()
  // Badge counts: `size: 1` because we only need the total `count`.
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
  const nav = locked
    ? primary.filter((item) => item.href === "/doctor")
    : primary
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
    verification && !approved && pathname !== VERIFICATION_ROUTE
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
      primary={nav}
      secondary={secondary}
      user={{
        name: tc("doctorName", { name: profile.name }),
        subtitle: clinic?.clinicName ?? profile.email,
        avatarUrl: profile.avatarUrl,
      }}
      banner={banner}
    >
      <LicenseDraftUploader email={profile.email} verification={verification} />
      {blocked ? null : children}
    </SidebarShell>
  )
}
