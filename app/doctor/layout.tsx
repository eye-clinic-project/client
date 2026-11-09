import type { ReactNode } from "react"

import { DoctorShell } from "@/components/shell/doctor-shell"

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <DoctorShell>{children}</DoctorShell>
}
