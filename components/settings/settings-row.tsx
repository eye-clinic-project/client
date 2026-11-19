import type { ReactNode } from "react"

export function SettingsRow({
  title,
  hint,
  children,
}: {
  title: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="flex max-w-xl min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold">{title}</span>
        {hint && (
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
