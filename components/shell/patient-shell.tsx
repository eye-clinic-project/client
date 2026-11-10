"use client"

import type { ReactNode } from "react"
import { CalendarDays, FileText, Home, MessageSquare, ScanEye, Stethoscope } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { AppShell, type NavItem } from "@/components/shell/app-shell"
import { Spinner } from "@/components/rc/ui"
import { useRequireRole } from "@/hooks/use-session"
import type { PatientProfile } from "@/lib/api-types"

export function PatientShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("patient")
  const { t } = useI18n()

  if (!me) return <Spinner label={t.common.loadingAccount} />

  const nav: NavItem[] = [
    { href: "/patient", label: t.nav.home, icon: Home, exact: true },
    { href: "/patient/results", label: t.nav.myResults, icon: ScanEye },
    { href: "/patient/reports", label: t.nav.reports, icon: FileText },
    { href: "/patient/appointments", label: t.nav.appointments, icon: CalendarDays },
    { href: "/patient/messages", label: t.nav.messages, icon: MessageSquare },
    { href: "/patient/doctors", label: t.nav.doctors, icon: Stethoscope },
  ]
  const profile = me.profile as PatientProfile | null

  return (
    <AppShell me={me} nav={nav} roleLabel={t.common.patient} subtitle={profile?.medicalRecordNumber ?? me.email}>
      {children}
    </AppShell>
  )
}
