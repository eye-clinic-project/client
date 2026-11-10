"use client"

import { createContext, useContext, type ReactNode } from "react"
import { LayoutDashboard, ShieldCheck, Users } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { AppShell, type NavItem } from "@/components/shell/app-shell"
import { Spinner } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useRequireRole } from "@/hooks/use-session"
import { adminService } from "@/service/admin.service"

type AdminCtx = { pendingDoctors: number; reloadCounts: () => Promise<void> }
const AdminContext = createContext<AdminCtx>({ pendingDoctors: 0, reloadCounts: async () => {} })

/** Pending-license count shared by the sidebar badge and the pages that change it. */
export const useAdminCounts = () => useContext(AdminContext)

export function AdminShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("admin")
  const { t } = useI18n()
  const counts = useApi(me ? () => adminService.doctors({ status: "pending", size: 1 }) : null, [me?.id])

  if (!me) return <Spinner label={t.common.loadingWorkspace} />

  const pendingDoctors = counts.data?.total ?? 0
  const nav: NavItem[] = [
    { href: "/admin", label: t.nav.overview, icon: LayoutDashboard, exact: true },
    { href: "/admin/doctors", label: t.nav.licenseReviews, icon: ShieldCheck, badge: pendingDoctors },
    { href: "/admin/users", label: t.nav.users, icon: Users },
  ]

  return (
    <AdminContext.Provider value={{ pendingDoctors, reloadCounts: counts.reload }}>
      <AppShell me={me} nav={nav} roleLabel={t.admin.eyebrow} subtitle={me.email}>
        {children}
      </AppShell>
    </AdminContext.Provider>
  )
}
