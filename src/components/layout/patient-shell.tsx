"use client"

/** Patient frame: SidebarShell with patient navigation and unread/upcoming badges. */

import {
  BellIcon,
  CalendarCheckIcon,
  CalendarPlusIcon,
  FileTextIcon,
  HomeIcon,
  MessageSquareIcon,
  SettingsIcon,
  StethoscopeIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { useListConversationsQuery } from "@/services/chat.service"
import { useGetUnreadCountQuery } from "@/services/notification.service"
import type { SessionProfile } from "@/types/next-auth"

import { SidebarShell, type ShellNavItem } from "./sidebar-shell"

export function PatientShell({
  profile,
  children,
}: {
  profile: SessionProfile
  children: ReactNode
}) {
  const t = useTranslations("shell")
  const { data: conversations } = useListConversationsQuery()
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  })
  const unreadMessages =
    conversations?.reduce(
      (sum, conversation) => sum + conversation.unreadCount,
      0
    ) ?? 0

  const primary: ShellNavItem[] = [
    { href: "/patient", label: t("home"), icon: HomeIcon },
    {
      href: "/patient/book",
      label: t("book"),
      icon: CalendarPlusIcon,
    },
    {
      href: "/patient/appointments",
      label: t("visits"),
      icon: CalendarCheckIcon,
    },
    { href: "/patient/reports", label: t("reports"), icon: FileTextIcon },
    { href: "/patient/doctors", label: t("myDoctors"), icon: StethoscopeIcon },
    {
      href: "/patient/messages",
      label: t("messages"),
      icon: MessageSquareIcon,
      badge: unreadMessages,
    },
  ]
  const secondary: ShellNavItem[] = [
    {
      href: "/patient/notifications",
      label: t("notifications"),
      icon: BellIcon,
      badge: unread?.unreadCount,
    },
    { href: "/patient/settings", label: t("settings"), icon: SettingsIcon },
  ]

  return (
    <SidebarShell
      home="/patient"
      primary={primary}
      secondary={secondary}
      user={{
        name: profile.name,
        subtitle: profile.email,
        avatarUrl: profile.avatarUrl,
      }}
    >
      {children}
    </SidebarShell>
  )
}
