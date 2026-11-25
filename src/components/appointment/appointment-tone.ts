/** Color tone for an appointment chip. A pending change request wins over the status. */

import type { Tone } from "@/lib/format"
import type { Appointment } from "@/types/api"

export function appointmentTone(
  appointment: Pick<Appointment, "status" | "changeRequest">
): Tone {
  if (appointment.changeRequest?.status === "pending") return "warning"
  if (appointment.status === "confirmed") return "success"
  if (appointment.status === "cancelled") return "danger"
  if (appointment.status === "completed") return "info"
  return "neutral"
}
