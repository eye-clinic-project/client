import { Suspense } from "react"

import { DoctorReviews } from "@/components/admin/doctor-reviews"

export default function AdminDoctorsPage() {
  return (
    <Suspense>
      <DoctorReviews />
    </Suspense>
  )
}
