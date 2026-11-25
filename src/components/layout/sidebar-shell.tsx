"use client"

/**
 * Generic app frame used by every role: sidebar navigation (with badges), user card,
 * sign-out, optional banner, and a collapsible menu on small screens.
 * Role shells (admin/doctor/patient-shell.tsx) only build the nav items.
 */

import { LogOutIcon, MenuIcon, XIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useId, useState, type ReactNode } from "react"

import { Logo } from "@/components/brand/logo"
import { LanguageSelect } from "@/components/common/language-select"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { UserAvatar } from "@/components/common/user-avatar"
import { useSignOut } from "@/hooks/use-sign-out"
import { cn } from "@/lib/utils"

/** One sidebar link. `badge` shows a count (hidden when 0/undefined). */
export interface ShellNavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  badgeTone?: "warning" | "info"
}

interface SidebarShellProps {
  home: string
  primary: ShellNavItem[]
  secondary?: ShellNavItem[]
  user: { name: string; subtitle: string; avatarUrl: string | null }
  banner?: ReactNode
  children: ReactNode
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: ShellNavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 px-3 text-sm",
        active
          ? "bg-brand-soft font-semibold text-brand-strong"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {item.label}
      {item.badge ? (
        <span
          className={cn(
            "ms-auto px-2 py-0.5 text-xs font-semibold",
            item.badgeTone === "warning"
              ? "bg-warning-soft text-warning"
              : "bg-brand-soft text-brand-strong"
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  )
}

export function SidebarShell({
  home,
  primary,
  secondary = [],
  user,
  banner,
  children,
}: SidebarShellProps) {
  const pathname = usePathname()
  const t = useTranslations("shell")
  const tc = useTranslations("common")
  const navId = useId()
  const [open, setOpen] = useState(false)
  const { signOut, pending } = useSignOut()
  const close = () => setOpen(false)
  // The home link is active only on itself; other links also on their sub-pages.
  const isActive = (href: string) =>
    href === home ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-svh bg-background text-foreground lg:flex">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href={home} aria-label={tc("home")}>
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={navId}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-11 items-center justify-center border border-border"
        >
          {open ? (
            <XIcon className="size-5" aria-hidden="true" />
          ) : (
            <MenuIcon className="size-5" aria-hidden="true" />
          )}
        </button>
      </header>

      <nav
        id={navId}
        aria-label={t("mainNav")}
        className={cn(
          "flex-col gap-7 border-b border-border bg-surface px-4 py-6",
          open ? "flex" : "hidden",
          "lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[260px] lg:shrink-0 lg:overflow-y-auto lg:border-e lg:border-b-0"
        )}
      >
        <Link href={home} className="hidden px-2 lg:block">
          <Logo size="sm" />
        </Link>
        <div className="flex flex-col gap-1">
          {primary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </div>
        <div className="flex flex-col gap-0.5 lg:mt-auto">
          {secondary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={pending}
            className="flex min-h-11 items-center gap-3 px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <LogOutIcon className="size-[18px]" aria-hidden="true" />
            {t("signOut")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1">
          <ThemeToggle />
          <LanguageSelect />
        </div>
        <div className="flex items-center gap-3 border border-border bg-background p-3">
          <UserAvatar name={user.name} src={user.avatarUrl} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            <span className="truncate text-xs text-subtle">
              {user.subtitle}
            </span>
          </span>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-1 flex-col gap-7 px-4 pt-7 pb-12 sm:px-10">
        {banner}
        {children}
      </main>
    </div>
  )
}
