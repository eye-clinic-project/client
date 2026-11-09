import { apiClient } from "./api-client"
import type { Appointment, AppointmentStatus, Paged, Slot } from "@/lib/api-types"

export const appointmentService = {
  list: (query: { status?: AppointmentStatus; from?: string; to?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<Appointment>>("/appointments", { query }),

  book: (dto: { slotId: string; reason?: string; patientId?: string }) =>
    apiClient<Appointment & { confirmation: string }>("/appointments", { method: "POST", body: dto }),

  reschedule: (id: string, slotId: string) =>
    apiClient<Appointment>(`/appointments/${id}`, { method: "PATCH", body: { slotId } }),

  confirm: (id: string) => apiClient<Appointment>(`/appointments/${id}/confirm`, { method: "PATCH" }),

  complete: (id: string) => apiClient<Appointment>(`/appointments/${id}/complete`, { method: "PATCH" }),

  cancel: (id: string, reason?: string) =>
    apiClient<Appointment>(`/appointments/${id}/cancel`, { method: "PATCH", body: { reason } }),
}

export const availabilityService = {
  list: (query: { doctorId?: string; from?: string; to?: string; onlyAvailable?: boolean } = {}) =>
    apiClient<Slot[]>("/doctor-availability", { query }),

  /** Splits [startAt, endAt) into slots of `slotMinutes`. */
  create: (dto: { startAt: string; endAt: string; slotMinutes?: number }) =>
    apiClient<Slot[]>("/doctor-availability", { method: "POST", body: dto }),

  remove: (id: string) => apiClient<{ deleted: true }>(`/doctor-availability/${id}`, { method: "DELETE" }),
}
