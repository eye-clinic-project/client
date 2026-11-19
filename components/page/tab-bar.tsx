"use client"

import { cn } from "@/lib/utils"

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

export function TabBar<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex gap-6 overflow-x-auto border-b border-border",
        className
      )}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px min-h-10 border-b-2 px-0.5 text-sm font-semibold whitespace-nowrap",
              selected
                ? "border-brand text-foreground"
                : "border-transparent text-subtle hover:text-foreground"
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ms-1.5 font-medium text-subtle">
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
