/** Small colored label for statuses. Color comes from a Tone (neutral/info/success/warning/danger). */

import type { ReactNode } from "react"

import type { Tone } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
}

export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center px-2.5 text-xs font-semibold",
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
