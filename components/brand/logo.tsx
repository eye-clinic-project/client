import { cn } from "@/lib/utils"

interface LogoProps {
  tone?: "light" | "dark"
  size?: "sm" | "md"
  className?: string
}

export function Logo({ tone = "dark", size = "md", className }: LogoProps) {
  const ring = tone === "light" ? "var(--brand-glow)" : "var(--brand)"
  const pupil = tone === "light" ? "var(--brand-panel)" : "#ffffff"
  const dimension = size === "sm" ? 30 : 36

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 36 36"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke={ring}
          strokeWidth="2.5"
        />
        <circle cx="18" cy="18" r="7" fill={ring} />
        <circle cx="20.5" cy="15.5" r="2" fill={pupil} />
      </svg>
      <span
        className={cn(
          "font-bold tracking-tight",
          size === "sm" ? "text-xl" : "text-2xl"
        )}
      >
        RetinaCare
      </span>
    </span>
  )
}
