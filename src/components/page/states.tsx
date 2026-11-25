"use client"

import { CircleAlertIcon, InboxIcon, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      <span className="inline-flex size-12 items-center justify-center bg-brand-soft text-brand">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="text-[15px] font-semibold">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  )
}

export function ErrorState({
  onRetry,
  message,
  className,
}: {
  onRetry?: () => void
  message?: string
  className?: string
}) {
  const t = useTranslations("common")
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-10 text-center",
        className
      )}
    >
      <CircleAlertIcon className="size-6 text-danger" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {message ?? t("loadFailed")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-9 border border-border px-3 text-[13px] font-semibold hover:bg-muted"
        >
          {t("retry")}
        </button>
      )}
    </div>
  )
}

export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  const t = useTranslations("common")
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-none" />
      ))}
    </div>
  )
}
