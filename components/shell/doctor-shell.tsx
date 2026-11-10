"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { CalendarDays, FileText, Home, MessageSquare, ScanEye, Users } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { AppShell, TopBar, type NavItem } from "@/components/shell/app-shell"
import { Spinner } from "@/components/rc/ui"
import { isApproved, useRequireRole } from "@/hooks/use-session"
import type { DoctorProfile } from "@/lib/api-types"

const PENDING_PATH = "/doctor/pending"

/**
 * Doctor area. Until an admin approves the doctor's license, only the approval page is reachable;
 * every other doctor page redirects there (the server enforces the same rule on the API).
 */
export function DoctorShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("doctor")
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()

  const approved = isApproved(me)
  const onPendingPage = pathname === PENDING_PATH

  useEffect(() => {
    if (!me) return
    if (!approved && !onPendingPage) router.replace(PENDING_PATH)
    else if (approved && onPendingPage) router.replace("/doctor")
  }, [me, approved, onPendingPage, router])

  if (!me) return <Spinner label={t.common.loadingWorkspace} />
  if (approved === onPendingPage) return <Spinner label={t.common.loadingWorkspace} />

  if (!approved) {
    return (
      <div className="min-h-svh bg-background">
        <TopBar me={me} showLogo />
        <main className="mx-auto flex w-full max-w-[960px] flex-col gap-7 px-4 py-8 sm:px-6 lg:py-12">{children}</main>
      </div>
    )
  }

  const nav: NavItem[] = [
    { href: "/doctor", label: t.nav.dashboard, icon: Home, exact: true },
    { href: "/doctor/patients", label: t.nav.patients, icon: Users },
    { href: "/doctor/scan", label: t.nav.newScan, icon: ScanEye },
    { href: "/doctor/appointments", label: t.nav.appointments, icon: CalendarDays },
    { href: "/doctor/messages", label: t.nav.messages, icon: MessageSquare },
    { href: "/doctor/reports", label: t.nav.reports, icon: FileText },
  ]
  const profile = me.profile as DoctorProfile | null

  return (
    <AppShell me={me} nav={nav} roleLabel={t.common.doctor} subtitle={profile?.clinicName ?? me.email}>
      {children}
    </AppShell>
  )
}
