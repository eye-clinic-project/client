"use client"

/** Admin frame: SidebarShell with the admin navigation. */

import { ShieldCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import type { SessionProfile } from "@/types/next-auth"

import { SidebarShell } from "./sidebar-shell"

export function AdminShell({
  profile,
  children,
}: {
  profile: SessionProfile
  children: ReactNode
}) {
  const t = useTranslations("shell")
  return (
    <SidebarShell
      home="/admin"
      primary={[
        {
          href: "/admin",
          label: t("verification"),
          icon: ShieldCheckIcon,
        },
      ]}
      user={{
        name: profile.name,
        subtitle: t("administrator"),
        avatarUrl: profile.avatarUrl,
      }}
    >
      {children}
    </SidebarShell>
  )
}
