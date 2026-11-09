"use client"

import Link from "next/link"
import { forwardRef, useId, type ComponentProps, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import type { DrLevel } from "@/lib/api-types"
import { GRADE_CHIP } from "@/lib/grades"
import { formatWait } from "@/service/api-client"
import { cn } from "@/lib/utils"

/* ---------- Brand ---------- */

export function LogoMark({ size = 28, inverted = false }: { size?: number; inverted?: boolean }) {
  const ring = inverted ? "#7FD1D9" : "var(--primary)"
  const glint = inverted ? "#0A3D44" : "var(--card)"
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" stroke={ring} strokeWidth="2.5" />
      <circle cx="18" cy="18" r="7" fill={ring} />
      <circle cx="20.5" cy="15.5" r="2.2" fill={glint} />
    </svg>
  )
}

export function Logo({ inverted = false, size = 28, className }: { inverted?: boolean; size?: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} inverted={inverted} />
      <span dir="ltr" className="font-heading text-[19px] font-bold tracking-tight">RetinaCare</span>
    </span>
  )
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "outline" | "ghost" | "danger"
type Size = "md" | "lg" | "sm"

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover border border-transparent",
  outline: "border border-input bg-card text-foreground hover:bg-muted",
  ghost: "border border-transparent text-subtle-foreground hover:bg-muted",
  danger: "border border-input bg-card text-danger-fg hover:bg-danger-bg",
}
const sizeClass: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm",
  md: "h-12 px-[18px] text-[15px]",
  lg: "h-[50px] px-7 text-base",
}

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-55",
    variantClass[variant],
    sizeClass[size],
    className,
  )
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

/* ---------- Form fields ---------- */

export const controlClass =
  "h-12 w-full rounded-[10px] border border-input bg-card px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25 aria-invalid:border-[1.5px] aria-invalid:border-destructive disabled:opacity-60"

type FieldProps = {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  className?: string
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode
  action?: ReactNode
}

/** Label, control, hint and error wired together for screen readers. */
export function Field({ label, hint, error, optional, className, children, action }: FieldProps) {
  const id = useId()
  const { t } = useI18n()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {optional && <span className="font-normal text-muted-foreground"> {t.common.optional}</span>}
        </label>
        {action}
      </div>
      {children({ id, ...(error ? { "aria-invalid": true } : {}), ...(describedBy ? { "aria-describedby": describedBy } : {}) })}
      {error ? (
        <span id={`${id}-err`} className="text-[13px] font-medium text-destructive">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClass, className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(controlClass, "pe-8", className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(controlClass, "h-auto min-h-24 py-3 leading-relaxed", className)} {...props} />
})

export function Checkbox({ children, className, ...props }: ComponentProps<"input"> & { children: ReactNode }) {
  return (
    <label className={cn("flex items-start gap-3 text-sm leading-normal text-subtle-foreground", className)}>
      <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 accent-primary" {...props} />
      <span>{children}</span>
    </label>
  )
}

/** Big selectable card used for role and eye choice. */
export function ChoiceCard({
  checked,
  title,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { title: string; description?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3.5 rounded-xl p-[18px] transition-colors",
        checked ? "border-2 border-primary bg-accent" : "border border-input bg-card hover:bg-muted/60",
        className,
      )}
    >
      <input type="radio" checked={checked} className="mt-[3px] size-[18px] shrink-0 accent-primary" {...props} />
      <span className="flex flex-col gap-1">
        <span className="text-base font-semibold">{title}</span>
        {description && <span className="text-sm leading-snug text-muted-foreground">{description}</span>}
      </span>
    </label>
  )
}

/* ---------- Feedback ---------- */

const alertTone = {
  error: { cls: "bg-danger-bg text-danger-fg", Icon: AlertCircle },
  warning: { cls: "bg-warning-bg text-warning-fg", Icon: TriangleAlert },
  info: { cls: "bg-accent text-accent-foreground", Icon: Info },
  success: { cls: "bg-[#E7F5EC] text-[#14532D] dark:bg-[#123322] dark:text-[#8fe0aa]", Icon: CheckCircle2 },
}

export function Alert({
  tone = "error",
  children,
  className,
  action,
}: {
  tone?: keyof typeof alertTone
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  const { cls, Icon } = alertTone[tone]
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-sm leading-normal", cls, className)}
    >
      <Icon className="mt-px size-[18px] shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  )
}

/** Shows the countdown while the server's rate limiter blocks an action. */
export function RateLimitNotice({ remaining, className }: { remaining: number; className?: string }) {
  const { t } = useI18n()
  if (remaining <= 0) return null
  return (
    <Alert tone="warning" className={className}>
      {t.errors.rateLimitNotice} <strong>{formatWait(remaining)}</strong>.
    </Alert>
  )
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      {label ?? t.common.loading}…
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

/* ---------- Layout bits ---------- */

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border bg-card", className)} {...props} />
}

export function CardHeader({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b px-5 py-[18px]", className)}>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {action}
    </div>
  )
}

export function PageTitle({ children, eyebrow, className }: { children: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
      <h1 className="font-heading text-[28px] font-semibold tracking-tight sm:text-[32px]">{children}</h1>
    </div>
  )
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.35) }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" />
  }
  const letters = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
  return (
    <span
      aria-hidden="true"
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-deep font-semibold text-white"
    >
      {letters || "?"}
    </span>
  )
}

/* ---------- Chips ---------- */

export const chipClass = "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold"

export function Chip({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(chipClass, "bg-muted text-subtle-foreground", className)} {...props} />
}

export function GradeChip({ level, className }: { level: DrLevel | null | undefined; className?: string }) {
  const { t } = useI18n()
  if (level === null || level === undefined) return <Chip className={className}>{t.common.noScanYet}</Chip>
  return <span className={cn(chipClass, GRADE_CHIP[level], className)}>{t.grades.short[level]}</span>
}

const statusTone: Record<string, string> = {
  confirmed: "bg-accent text-accent-foreground",
  active: "bg-accent text-accent-foreground",
  completed: "bg-[#E7F5EC] text-[#166534] dark:bg-[#123322] dark:text-[#8fe0aa]",
  sent: "bg-[#E7F5EC] text-[#166534] dark:bg-[#123322] dark:text-[#8fe0aa]",
  pending: "bg-warning-bg text-warning-fg",
  processing: "bg-warning-bg text-warning-fg",
  draft: "bg-muted text-subtle-foreground",
  failed: "bg-danger-bg text-danger-fg",
  cancelled: "bg-muted text-muted-foreground",
  ended: "bg-muted text-muted-foreground",
}

export function StatusChip({ status, label, className }: { status: string; label?: string; className?: string }) {
  const { t } = useI18n()
  return (
    <span className={cn(chipClass, statusTone[status] ?? "bg-muted text-subtle-foreground", className)}>
      {label ?? t.status[status] ?? status}
    </span>
  )
}
