"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { CalendarDays, FileText, Home, LogOut, Menu, MessageSquare, ScanEye, Users, X } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Avatar, Logo, Spinner } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRequireRole, useSession } from "@/hooks/use-session"
import type { DoctorProfile } from "@/lib/api-types"
import { doctorName } from "@/lib/format"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/doctor", key: "dashboard", icon: Home, exact: true },
  { href: "/doctor/patients", key: "patients", icon: Users },
  { href: "/doctor/scan", key: "newScan", icon: ScanEye },
  { href: "/doctor/appointments", key: "appointments", icon: CalendarDays },
  { href: "/doctor/messages", key: "messages", icon: MessageSquare },
  { href: "/doctor/reports", key: "reports", icon: FileText },
] as const

export function DoctorShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("doctor")
  const { logout } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  if (!me) return <Spinner label={t.common.loadingWorkspace} />
  const profile = me.profile as DoctorProfile | null

  const nav = (
    <nav aria-label={t.nav.main} className="flex h-full flex-col gap-7 px-4 py-6">
      <Logo className="px-2" />
      <div className="flex flex-col gap-1 text-[15px] font-medium">
        {NAV.map(({ href, key, icon: Icon, ...rest }) => {
          const exact = "exact" in rest
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-[10px] px-3",
                active ? "bg-accent font-semibold text-accent-foreground" : "text-subtle-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {t.nav[key]}
            </Link>
          )
        })}
      </div>
      <div className="mt-auto flex flex-col gap-2 border-t pt-3">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <Avatar name={me.name} src={me.avatarUrl} size={36} />
          <span className="flex min-w-0 flex-col text-sm">
            <span className="truncate font-semibold">{doctorName(me.name)}</span>
            <span className="truncate text-[13px] text-muted-foreground">{profile?.clinicName ?? me.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex h-10 flex-1 items-center gap-2 rounded-[10px] px-2 text-sm font-medium text-subtle-foreground hover:bg-muted"
          >
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden="true" /> {t.common.logOut}
          </button>
          <ThemeToggle />
        </div>
        <div className="px-1">
          <LanguageSwitcher className="w-full justify-center" />
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[260px] border-e bg-sidebar lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label={t.common.closeMenu} className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(18rem,85vw)] border-e bg-sidebar shadow-xl">
            <button
              type="button"
              aria-label={t.common.closeMenu}
              onClick={() => setOpen(false)}
              className="absolute top-5 end-3 flex size-10 items-center justify-center rounded-[10px] hover:bg-muted"
            >
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:ps-[260px]">
        <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <button
            type="button"
            aria-label={t.common.openMenu}
            onClick={() => setOpen(true)}
            className="flex size-11 items-center justify-center rounded-[10px] border border-input"
          >
            <Menu className="size-5" />
          </button>
          <Logo />
          <span className="size-11" />
        </div>
        <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
