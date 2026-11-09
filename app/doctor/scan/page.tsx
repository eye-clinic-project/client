import { Suspense } from "react"

import { NewScanPage } from "@/components/doctor/new-scan"

export default function NewScanRoute() {
  return (
    <Suspense>
      <NewScanPage />
    </Suspense>
  )
}
