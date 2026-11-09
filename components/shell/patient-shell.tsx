"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { LogOut } from "lucide-react"

import { NotificationBell } from "@/components/shell/notification-bell"
import { Avatar, Logo, Spinner } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRequireRole, useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/patient", label: "Home", exact: true },
  { href: "/patient/results", label: "My results" },
  { href: "/patient/reports", label: "Reports" },
  { href: "/patient/appointments", label: "Appointments" },
  { href: "/patient/messages", label: "Messages" },
  { href: "/patient/doctors", label: "Doctors" },
]

export function PatientShell({ children }: { children: ReactNode }) {
  const me = useRequireRole("patient")
  const { logout } = useSession()
  const pathname = usePathname()
  const [menu, setMenu] = useState(false)

  if (!me) return <Spinner label="Loading your account" />

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/patient" aria-label="RetinaCare home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto pb-1 text-[15px] font-medium md:order-none md:w-auto md:pb-0">
            {NAV.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 shrink-0 items-center rounded-[10px] px-3.5",
                    active ? "bg-accent font-semibold text-accent-foreground" : "text-subtle-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <div className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={menu}
                onClick={() => setMenu((v) => !v)}
                className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <Avatar name={me.name} src={me.avatarUrl} size={40} />
              </button>
              {menu && (
                <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border bg-popover p-2 shadow-lg">
                  <p className="truncate px-2 py-1.5 text-sm font-semibold">{me.name}</p>
                  <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{me.email}</p>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted"
                  >
                    <LogOut className="size-4" aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pt-8 pb-14 sm:px-6">{children}</main>
    </div>
  )
}
