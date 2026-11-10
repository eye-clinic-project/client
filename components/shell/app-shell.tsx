"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import { LogOut, Menu, X } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationBell } from "@/components/shell/notification-bell"
import { Avatar, Logo } from "@/components/rc/ui"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "@/hooks/use-session"
import type { Me } from "@/lib/api-types"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
  exact?: boolean
  /** Small count shown next to the label, e.g. licenses waiting for review. */
  badge?: number
}

type AppShellProps = {
  me: Me
  nav: NavItem[]
  /** Shown under the name in the sidebar, e.g. the clinic or "Administrator". */
  subtitle?: string
  /** Role label on the sidebar header chip. */
  roleLabel: string
  children: ReactNode
}

/**
 * Workspace layout shared by the doctor, patient and admin areas:
 * a sidebar on desktop, a slide-in drawer on phones, and a top bar with notifications and the account menu.
 */
export function AppShell({ me, nav, subtitle, roleLabel, children }: AppShellProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useI18n()

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const sidebar = (
    <nav aria-label={t.nav.main} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-5">
        <Link href={nav[0]?.href ?? "/"} aria-label={t.common.homeLink}>
          <Logo />
        </Link>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground uppercase">
          {roleLabel}
        </span>
      </div>

      <p className="px-6 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {t.nav.workspace}
      </p>
      <ul className="flex flex-col gap-0.5 px-3 text-[15px] font-medium">
        {nav.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-[10px] px-3 transition-colors",
                  active
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-subtle-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <span aria-hidden="true" className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-primary" />
                )}
                <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {!!item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C2410C] px-1.5 text-[11px] font-bold text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
          <Avatar name={me.name} src={me.avatarUrl} size={38} />
          <span className="flex min-w-0 flex-1 flex-col text-sm">
            <span className="truncate font-semibold">{me.name}</span>
            <span className="truncate text-[13px] text-muted-foreground">{subtitle ?? me.email}</span>
          </span>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[264px] border-e bg-sidebar lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t.common.closeMenu}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[min(18rem,85vw)] border-e bg-sidebar shadow-xl">
            <button
              type="button"
              aria-label={t.common.closeMenu}
              onClick={() => setOpen(false)}
              className="absolute top-5 end-3 z-10 flex size-10 items-center justify-center rounded-[10px] hover:bg-muted"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:ps-[264px]">
        <TopBar me={me} onMenu={() => setOpen(true)} />
        <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

/** Sticky bar with the menu button (phones), notifications, theme, language and the account menu. */
export function TopBar({ me, onMenu, showLogo = false }: { me: Me; onMenu?: () => void; showLogo?: boolean }) {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-20 border-b bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        {onMenu && (
          <button
            type="button"
            aria-label={t.common.openMenu}
            onClick={onMenu}
            className="flex size-10 items-center justify-center rounded-[10px] border border-input lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        )}
        <span className={cn(!showLogo && "lg:hidden")}>
          <Logo size={26} />
        </span>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle />
          <NotificationBell size={40} />
          <AccountMenu me={me} />
        </div>
      </div>
    </header>
  )
}

function AccountMenu({ me }: { me: Me }) {
  const { logout } = useSession()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={t.common.accountMenu}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <Avatar name={me.name} src={me.avatarUrl} size={38} />
      </button>
      {open && (
        <div className="absolute end-0 z-40 mt-2 w-60 rounded-xl border bg-popover p-2 shadow-lg">
          <p className="truncate px-2 pt-1 text-sm font-semibold">{me.name}</p>
          <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{me.email}</p>
          <div className="border-t pt-1">
            <LanguageSwitcher className="mb-1 w-full justify-start border-0 px-2 sm:hidden" />
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="size-4 rtl:-scale-x-100" aria-hidden="true" /> {t.common.logOut}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
