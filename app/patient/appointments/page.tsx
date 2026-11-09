import { Suspense } from "react"

import { BookAppointment } from "@/components/patient/book-appointment"

export default function PatientAppointmentsRoute() {
  return (
    <Suspense>
      <BookAppointment />
    </Suspense>
  )
}
