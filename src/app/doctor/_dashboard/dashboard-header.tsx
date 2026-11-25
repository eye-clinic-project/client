"use client"

import { BellIcon, SearchIcon, UploadIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { FormEvent } from "react"

import { firstName } from "@/lib/format"
import { useFormat, useGreeting } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import { useGetUnreadCountQuery } from "@/services/notification.service"

/** Date + greeting, patient search, notifications bell and "New analysis". */
export function DashboardHeader({
  name,
  locked,
}: {
  name: string
  /** Doctor not approved yet: "New analysis" is disabled. */
  locked: boolean
}) {
  const router = useRouter()
  const t = useTranslations("dashboard")
  const format = useFormat()
  const greet = useGreeting()
  const { data: unread } = useGetUnreadCountQuery()

  // Search goes to the patients page with the query in the URL.
  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget)
      .get("search")
      ?.toString()
      .trim()
    router.push(
      query
        ? `/doctor/patients?search=${encodeURIComponent(query)}`
        : "/doctor/patients"
    )
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-subtle">
          {format.longDate(new Date())}
        </span>
        <h1 className="text-[30px] font-semibold tracking-[-0.01em]">
          {greet(t("greeting", { name: firstName(name) }))}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <form role="search" onSubmit={onSearch}>
          <label className="flex h-11 w-[280px] max-w-full items-center gap-2 border border-border bg-card px-3.5">
            <SearchIcon className="size-4 text-subtle" aria-hidden="true" />
            <span className="sr-only">{t("searchLabel")}</span>
            <input
              name="search"
              type="search"
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        </form>
        <Link
          href="/doctor/notifications"
          aria-label={t("notifications", { count: unread?.unreadCount ?? 0 })}
          className="relative inline-flex size-11 items-center justify-center border border-border bg-card"
        >
          <BellIcon className="size-[18px]" aria-hidden="true" />
          {unread?.unreadCount ? (
            <span className="absolute end-2.5 top-2 size-2 rounded-full border-2 border-background bg-danger" />
          ) : null}
        </Link>
        <Link
          href="/doctor/analyses/new"
          aria-disabled={locked}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 bg-primary px-[18px] text-sm font-semibold text-primary-foreground hover:bg-primary/90",
            locked && "pointer-events-none opacity-50"
          )}
        >
          <UploadIcon className="size-4" aria-hidden="true" />
          {t("newAnalysis")}
        </Link>
      </div>
    </header>
  )
}
