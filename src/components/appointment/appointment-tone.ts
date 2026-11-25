import type { Appointment } from "@/types/api"
import type { Tone } from "@/util/format"

export function appointmentTone(
  appointment: Pick<Appointment, "status" | "changeRequest">
): Tone {
  if (appointment.changeRequest?.status === "pending") return "warning"
  if (appointment.status === "confirmed") return "success"
  if (appointment.status === "cancelled") return "danger"
  if (appointment.status === "completed") return "info"
  return "neutral"
}
