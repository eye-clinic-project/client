"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { notificationService } from "@/service/notification.service"
import { fmtRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

export function NotificationBell({ size = 44 }: { size?: number }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data, reload, setData } = useApi(() => notificationService.list({ size: 8 }), [])
  const unread = data?.unreadCount ?? 0

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), 60_000)
    return () => window.clearInterval(timer)
  }, [reload])

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

  async function markAll() {
    await notificationService.markAllRead().catch(() => null)
    setData((prev) => ({ ...prev!, unreadCount: 0, items: prev!.items.map((n) => ({ ...n, read: true })) }))
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-[10px] border border-input bg-card hover:bg-muted"
      >
        <Bell className="size-5 text-subtle-foreground" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C2410C] px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-sm font-semibold text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!data?.items.length && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</li>}
            {data?.items.map((n) => {
              const body = (
                <>
                  <span className="flex items-center gap-2 font-semibold">
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    {n.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground">{fmtRelative(n.createdAt)}</span>
                </>
              )
              const cls = cn("flex flex-col gap-0.5 border-t px-4 py-3 text-left first:border-t-0", !n.read && "bg-accent/40")
              const onClick = () => {
                setOpen(false)
                if (!n.read) void notificationService.markRead(n.id).then(() => reload()).catch(() => null)
              }
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={onClick} className={cn(cls, "hover:bg-muted")}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
