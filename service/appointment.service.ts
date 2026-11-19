import type {
  Appointment,
  AppointmentStatus,
  Paginated,
  RescheduleReason,
  Slot,
} from "@/types/api"
import { api } from "./api"
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

const changed = (id: string) => [
  { type: "Appointment" as const, id },
  { type: "Appointment" as const, id: "LIST" },
  { type: "Slot" as const, id: "LIST" },
]

export const appointmentApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMyAppointments: build.query<
      Paginated<Appointment>,
      AppointmentListParams
    >({
      query: (params) => ({ url: "/appointment/me", params }),
      providesTags: (result) => listTags("Appointment", result),
    }),
    getAppointment: build.query<Appointment, string>({
      query: (id) => `/appointment/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Appointment", id }],
    }),
    listMyAvailability: build.query<Slot[], { from?: string; to?: string }>({
      query: (params) => ({ url: "/appointment/availability/me", params }),
      providesTags: (result) => listTags("Slot", result),
    }),
    createAvailability: build.mutation<Slot[], AvailabilityPayload>({
      query: (body) => ({
        url: "/appointment/availability",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Slot", id: "LIST" }],
    }),
    deleteAvailability: build.mutation<void, string>({
      query: (id) => ({
        url: `/appointment/availability/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Slot", id: "LIST" }],
    }),
    listDoctorSlots: build.query<Slot[], { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => ({
        url: `/appointment/doctors/${doctorId}/slots`,
        params: { date },
      }),
      providesTags: [{ type: "Slot", id: "LIST" }],
    }),
    bookAppointment: build.mutation<
      Appointment,
      { slotId: string; reason?: string }
    >({
      query: (body) => ({ url: "/appointment", method: "POST", body }),
      invalidatesTags: [
        { type: "Appointment", id: "LIST" },
        { type: "Slot", id: "LIST" },
      ],
    }),
    requestCancel: build.mutation<Appointment, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/appointment/${id}/cancel-request`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => changed(id),
    }),
    requestReschedule: build.mutation<
      Appointment,
      { id: string; slotId: string; reason: RescheduleReason; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/appointment/${id}/reschedule-request`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => changed(id),
    }),
    withdrawRequest: build.mutation<Appointment, string>({
      query: (id) => ({ url: `/appointment/${id}/request`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => changed(id),
    }),
    decideRequest: build.mutation<
      Appointment,
      { id: string; decision: "approve" | "reject"; note?: string }
    >({
      query: ({ id, decision, note }) => ({
        url: `/appointment/${id}/request/${decision}`,
        method: "POST",
        body: note ? { note } : {},
      }),
      invalidatesTags: (_result, _error, { id }) => changed(id),
    }),
  }),
})

export const {
  useListMyAppointmentsQuery,
  useGetAppointmentQuery,
  useListMyAvailabilityQuery,
  useCreateAvailabilityMutation,
  useDeleteAvailabilityMutation,
  useListDoctorSlotsQuery,
  useBookAppointmentMutation,
  useRequestCancelMutation,
  useRequestRescheduleMutation,
  useWithdrawRequestMutation,
  useDecideRequestMutation,
} = appointmentApi
