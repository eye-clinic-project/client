"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavigationItem = {
  label: string
  segment: string
  icon: typeof LayoutDashboard
}

const doctorNavigation: NavigationItem[] = [
  { label: "Overview", segment: "", icon: LayoutDashboard },
  { label: "Patients", segment: "patients", icon: Users },
  { label: "Image analysis", segment: "analysis", icon: Activity },
  { label: "Appointments", segment: "appointments", icon: CalendarDays },
  { label: "Messages", segment: "messages", icon: MessageCircle },
]

const patientNavigation: NavigationItem[] = [
  { label: "Overview", segment: "", icon: LayoutDashboard },
  { label: "My results", segment: "results", icon: Activity },
  { label: "Appointments", segment: "appointments", icon: CalendarDays },
  { label: "Reports", segment: "reports", icon: FileText },
  { label: "Messages", segment: "messages", icon: MessageCircle },
]

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPatient = pathname.startsWith("/patient")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigation = isPatient ? patientNavigation : doctorNavigation
  const routeBase = pathname.split("/").slice(0, 3).join("/")
  const panelName = isPatient ? "Patient portal" : "Doctor workspace"
  const userName = isPatient ? "Alex Morgan" : "Dr. Taylor"

  return (
    <div className="min-h-svh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        <PanelBrand />
        <PanelNavigation navigation={navigation} routeBase={routeBase} />
        <RoleSwitcher isPatient={isPatient} />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-5">
              <PanelBrand />
              <Button
                aria-label="Close navigation menu"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X />
              </Button>
            </div>
            <PanelNavigation
              navigation={navigation}
              routeBase={routeBase}
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <RoleSwitcher isPatient={isPatient} />
          </aside>
        </div>
      )}

      <div className="min-h-svh lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-label="Open navigation menu"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu />
            </Button>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span>Workspace</span>
              <span aria-hidden="true">/</span>
              <span className="truncate font-medium text-foreground">
                {panelName}
              </span>
            </div>
            <span className="truncate text-sm font-medium sm:hidden">
              {panelName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
              Demo data
            </span>
            <div
              aria-label={userName}
              className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              title={userName}
            >
              {isPatient ? "AM" : "DT"}
            </div>
            <span className="hidden text-sm font-medium sm:inline">{userName}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function PanelBrand() {
  return (
    <Link href="/panel" className="flex h-16 items-center gap-3 px-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <HeartPulse className="size-5" />
      </div>
      <div>
        <p className="font-semibold leading-tight">RetinaCare</p>
        <p className="text-xs text-muted-foreground">DR screening portal</p>
      </div>
    </Link>
  )
}

function PanelNavigation({
  navigation,
  routeBase,
  onNavigate,
}: {
  navigation: NavigationItem[]
  routeBase: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-5">
      {navigation.map(({ label, segment, icon: Icon }) => {
        const href = segment ? `${routeBase}/${segment}` : routeBase
        const active = pathname === href

        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function RoleSwitcher({ isPatient }: { isPatient: boolean }) {
  const href = isPatient ? "/doctor/demo" : "/patient/demo"
  const label = isPatient ? "Preview doctor workspace" : "Preview patient portal"

  return (
    <div className="border-t p-4">
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeftRight className="size-4" />
        {label}
      </Link>
      <p className="px-3 pt-3 text-xs text-muted-foreground">
        Prototype view · not connected to patient records
      </p>
    </div>
  )
}
