import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  id?: string
}) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col border border-border bg-card", className)}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          {title && (
            <h2 id={headingId} className="text-[15px] font-semibold">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className={cn("flex flex-col p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold tracking-[0.04em] text-subtle uppercase">
      {children}
    </h2>
  )
}

export function DetailList({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode }[]
  className?: string
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-3 text-sm",
        className
      )}
    >
      {items.map(({ label }, index) => (
        <div key={index} className="contents">
          <dt className="text-subtle">{label}</dt>
          <dd className="min-w-0 font-medium break-words">
            {items[index].value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
