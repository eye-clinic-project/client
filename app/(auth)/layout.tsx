import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-linear-to-br from-muted/70 via-background to-primary/5 px-4 py-10 sm:px-6">
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 size-80 rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-32 size-80 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  )
}
