import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const TONES = {
  error: {
    icon: CircleAlertIcon,
    className: "border-danger/30 bg-danger-soft text-danger",
    role: "alert",
  },
  success: {
    icon: CircleCheckIcon,
    className: "border-success/30 bg-success-soft text-success",
    role: "status",
  },
  info: {
    icon: InfoIcon,
    className: "border-brand/30 bg-brand-soft text-brand-strong",
    role: "status",
  },
} as const

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: keyof typeof TONES
  children: ReactNode
}) {
  const { icon: Icon, className, role } = TONES[tone]
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed",
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
