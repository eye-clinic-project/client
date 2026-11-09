import type { ReactNode } from "react"

import { PatientShell } from "@/components/shell/patient-shell"

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PatientShell>{children}</PatientShell>
}
