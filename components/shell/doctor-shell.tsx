"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { CalendarDays, FileText, Home, LogOut, Menu, MessageSquare, ScanEye, Users, X } from "lucide-react"

import { Avatar, Logo, Spinner } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRequireRole, useSession } from "@/hooks/use-session"
import type { DoctorProfile } from "@/lib/api-types"
import { doctorName } from "@/lib/format"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/doctor", label: "Dashboard", icon: Home, exact: true },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/scan", label: "New scan", icon: ScanEye },
  { href: "/doctor/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/doctor/messages", label: "Messages", icon: MessageSquare },
  { href: "/doctor/reports", label: "Reports", icon: FileText },
]

export function DoctorShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("doctor")
  const { logout } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (!me) return <Spinner label="Loading your workspace" />
  const profile = me.profile as DoctorProfile | null

  const nav = (
    <nav aria-label="Main" className="flex h-full flex-col gap-7 px-4 py-6">
      <Logo className="px-2" />
      <div className="flex flex-col gap-1 text-[15px] font-medium">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
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
              {label}
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
            <LogOut className="size-4" aria-hidden="true" /> Log out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r bg-sidebar lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[min(18rem,85vw)] border-r bg-sidebar shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-5 right-3 flex size-10 items-center justify-center rounded-[10px] hover:bg-muted"
            >
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:pl-[260px]">
        <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
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
