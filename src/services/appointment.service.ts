/**
 * Appointments (/appointment): doctor availability, patient booking, and
 * cancel/reschedule requests that the other side approves or rejects.
 */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type {
  Appointment,
  AppointmentStatus,
  Paginated,
  RescheduleReason,
  Slot,
} from "@/types/api"

import { listTags } from "./tags"

export interface AppointmentListParams {
  status?: AppointmentStatus
  pendingRequest?: boolean
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface AvailabilityPayload {
  startAt: string
  endAt: string
  slotMinutes: number
  breakMinutes?: number
}

/**
 * Tags to refresh after an appointment changes. Slots are included because
 * cancelling/rescheduling frees or takes a slot.
 */
const changed = (id: string) => [
  { type: "Appointment" as const, id },
  { type: "Appointment" as const, id: "LIST" },
  { type: "Slot" as const, id: "LIST" },
]

export const useListMyAppointmentsQuery = defineQuery<
  Paginated<Appointment>,
  AppointmentListParams
>({
  name: "listMyAppointments",
  query: (params) => ({ url: "/appointment/me", params }),
  providesTags: (data) => listTags("Appointment", data),
})

export const useGetAppointmentQuery = defineQuery<Appointment, string>({
  name: "getAppointment",
  query: (id) => `/appointment/${id}`,
  providesTags: (_data, id) => [{ type: "Appointment", id }],
})

// Doctor: own availability slots.
export const useListMyAvailabilityQuery = defineQuery<
  Slot[],
  { from?: string; to?: string }
>({
  name: "listMyAvailability",
  query: (params) => ({ url: "/appointment/availability/me", params }),
  providesTags: (data) => listTags("Slot", data),
})

// Doctor: split a time range into slots of `slotMinutes` (+ optional breaks).
export const useCreateAvailabilityMutation = defineMutation<
  Slot[],
  AvailabilityPayload
>({
  query: (body) => ({
    url: "/appointment/availability",
    method: "POST",
    body,
  }),
  invalidatesTags: [{ type: "Slot", id: "LIST" }],
})

export const useDeleteAvailabilityMutation = defineMutation<void, string>({
  query: (id) => ({
    url: `/appointment/availability/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: [{ type: "Slot", id: "LIST" }],
})

// Patient: free slots of one doctor on one day.
export const useListDoctorSlotsQuery = defineQuery<
  Slot[],
  { doctorId: string; date: string }
>({
  name: "listDoctorSlots",
  query: ({ doctorId, date }) => ({
    url: `/appointment/doctors/${doctorId}/slots`,
    params: { date },
  }),
  providesTags: [{ type: "Slot", id: "LIST" }],
})

export const useBookAppointmentMutation = defineMutation<
  Appointment,
  { slotId: string; reason?: string }
>({
  query: (body) => ({ url: "/appointment", method: "POST", body }),
  invalidatesTags: [
    { type: "Appointment", id: "LIST" },
    { type: "Slot", id: "LIST" },
  ],
})

export const useRequestCancelMutation = defineMutation<
  Appointment,
  { id: string; reason: string }
>({
  query: ({ id, reason }) => ({
    url: `/appointment/${id}/cancel-request`,
    method: "POST",
    body: { reason },
  }),
  invalidatesTags: (_result, { id }) => changed(id),
})

export const useRequestRescheduleMutation = defineMutation<
  Appointment,
  { id: string; slotId: string; reason: RescheduleReason; note?: string }
>({
  query: ({ id, ...body }) => ({
    url: `/appointment/${id}/reschedule-request`,
    method: "POST",
    body,
  }),
  invalidatesTags: (_result, { id }) => changed(id),
})

// Cancel my own pending cancel/reschedule request.
export const useWithdrawRequestMutation = defineMutation<Appointment, string>({
  query: (id) => ({ url: `/appointment/${id}/request`, method: "DELETE" }),
  invalidatesTags: (_result, id) => changed(id),
})

// Answer the other side's pending request.
export const useDecideRequestMutation = defineMutation<
  Appointment,
  { id: string; decision: "approve" | "reject"; note?: string }
>({
  query: ({ id, decision, note }) => ({
    url: `/appointment/${id}/request/${decision}`,
    method: "POST",
    body: note ? { note } : {},
  }),
  invalidatesTags: (_result, { id }) => changed(id),
})
