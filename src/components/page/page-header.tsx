/** Page title row: title, optional description and action buttons. */

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <p className="text-[13px] text-subtle">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
