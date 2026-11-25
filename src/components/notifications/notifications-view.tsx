"use client"

/**
 * Notifications inbox shared by doctors and patients: All/Unread tabs, grouped
 * into Today/Earlier, mark read, mark all read, delete, and "load more".
 * Clicking a notification marks it read and opens the related page (notificationRoute).
 */

import {
  BellIcon,
  CalendarDaysIcon,
  CheckIcon,
  FileTextIcon,
  MessageSquareIcon,
  ScanEyeIcon,
  ShieldCheckIcon,
  StickyNoteIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page/page-header"
import { SectionHeading } from "@/components/page/panel"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { Button } from "@/components/ui/button"
import { sameDay } from "@/lib/dates"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { notificationRoute } from "@/lib/notification-link"
import { cn } from "@/lib/utils"
import {
  useDeleteNotificationMutation,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/services/notification.service"
import type { AppNotification, NotificationType, Role } from "@/types/api"

// Icon and color per notification type.
const ICONS: Record<NotificationType, { icon: LucideIcon; className: string }> =
  {
    analysis: { icon: ScanEyeIcon, className: "bg-danger-soft text-danger" },
    appointment: {
      icon: CalendarDaysIcon,
      className: "bg-warning-soft text-warning",
    },
    report: {
      icon: FileTextIcon,
      className: "bg-brand-soft text-brand-strong",
    },
    message: {
      icon: MessageSquareIcon,
      className: "bg-brand-soft text-brand-strong",
    },
    system: {
      icon: ShieldCheckIcon,
      className: "bg-success-soft text-success",
    },
    note: { icon: StickyNoteIcon, className: "bg-muted text-muted-foreground" },
    follow_up: {
      icon: CalendarDaysIcon,
      className: "bg-warning-soft text-warning",
    },
  }

const PAGE_SIZE = 20

export function NotificationsView({ role }: { role: Exclude<Role, "admin"> }) {
  const t = useTranslations("notifications")
  const tc = useTranslations("common")
  const router = useRouter()
  const format = useFormat()
  const errorText = useErrorText()
  const [tab, setTab] = useState<"all" | "unread">("all")
  // "Load more" grows the page size instead of paging, so the list stays one query.
  const [size, setSize] = useState(PAGE_SIZE)
  const { data, isLoading, isError, refetch, isFetching } =
    useListNotificationsQuery({
      unread: tab === "unread" ? true : undefined,
      size,
    })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation()
  const [remove] = useDeleteNotificationMutation()
  const unread = data?.unreadCount ?? 0

  const today =
    data?.docs.filter((item) => sameDay(item.createdAt, new Date())) ?? []
  const earlier =
    data?.docs.filter((item) => !sameDay(item.createdAt, new Date())) ?? []

  const open = async (notification: AppNotification) => {
    if (!notification.read) void markRead(notification._id)
    router.push(
      notificationRoute(
        role,
        notification.link,
        notification.type,
        notification.resourceId
      )
    )
  }

  const group = (title: string, items: AppNotification[]) =>
    items.length > 0 && (
      <section className="flex flex-col gap-2">
        <SectionHeading>{title}</SectionHeading>
        <ul className="flex flex-col border border-b-0 border-border">
          {items.map((notification) => {
            const { icon: Icon, className } =
              ICONS[notification.type] ?? ICONS.note
            return (
              <li
                key={notification._id}
                className={cn(
                  "group flex items-start border-b border-border",
                  notification.read ? "bg-card" : "bg-surface"
                )}
              >
                <button
                  type="button"
                  onClick={() => void open(notification)}
                  className="flex min-w-0 flex-1 items-start gap-3.5 px-4 py-3.5 text-start"
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center",
                      className
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex justify-between gap-3">
                      <span
                        className={cn(
                          "text-sm",
                          notification.read ? "font-semibold" : "font-bold"
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-xs text-subtle">
                        {sameDay(notification.createdAt, new Date())
                          ? format.time(notification.createdAt)
                          : format.shortDate(notification.createdAt)}
                      </span>
                    </span>
                    <span className="text-[13px] leading-relaxed text-muted-foreground">
                      {notification.body}
                    </span>
                  </span>
                  {!notification.read && (
                    <span
                      aria-label={t("unreadLabel")}
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                    />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t("delete")}
                  onClick={() =>
                    remove(notification._id)
                      .unwrap()
                      .catch((caught: unknown) =>
                        toast.error(errorText(caught))
                      )
                  }
                  className="m-2 inline-flex size-9 shrink-0 items-center justify-center text-subtle opacity-60 hover:text-danger hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2Icon className="size-4" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("unread", { count: unread })}
        actions={
          <Button
            variant="outline"
            disabled={unread === 0 || markingAll}
            onClick={async () => {
              try {
                await markAll().unwrap()
                toast.success(t("markedAll"))
              } catch (caught) {
                toast.error(errorText(caught))
              }
            }}
            className="h-10 gap-2 rounded-none px-4"
          >
            <CheckIcon className="size-4" aria-hidden="true" />
            {t("markAll")}
          </Button>
        }
      />
      <TabBar
        label={t("views")}
        value={tab}
        onChange={setTab}
        items={[
          { value: "all", label: t("all") },
          {
            value: "unread",
            label: t("unreadTab"),
            count: unread || undefined,
          },
        ]}
      />
      <div className="flex max-w-[820px] flex-col gap-6">
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : !data || data.docs.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={tab === "unread" ? t("emptyUnread") : t("empty")}
          />
        ) : (
          <>
            {group(tc("today"), today)}
            {group(tc("earlier"), earlier)}
            {data.count > data.docs.length && (
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => setSize(size + PAGE_SIZE)}
                className="h-10 self-center rounded-none px-4"
              >
                {t("loadMore")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
