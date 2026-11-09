import { Suspense } from "react"

import { PatientsPage } from "@/components/doctor/patients"

export default function DoctorPatientsRoute() {
  return (
    <Suspense>
      <PatientsPage />
    </Suspense>
  )
}
