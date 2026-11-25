/** Admin endpoints: review doctor license submissions and enable/disable user accounts. */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type {
  AdminDoctor,
  DoctorVerificationStatus,
  Paginated,
} from "@/types/api"

import { listTags } from "./tags"

export interface AdminDoctorListParams {
  status?: DoctorVerificationStatus
  submitted?: boolean
  search?: string
  page?: number
  size?: number
}

/** Tags to refresh after an admin action on a doctor. */
const touched = (id: string) => [
  { type: "AdminDoctor" as const, id },
  { type: "AdminDoctor" as const, id: "LIST" },
]

export const useListAdminDoctorsQuery = defineQuery<
  Paginated<AdminDoctor>,
  AdminDoctorListParams
>({
  name: "listAdminDoctors",
  query: (params) => ({ url: "/admin/doctors", params }),
  providesTags: (data) => listTags("AdminDoctor", data),
})

export const useGetAdminDoctorQuery = defineQuery<AdminDoctor, string>({
  name: "getAdminDoctor",
  query: (id) => `/admin/doctors/${id}`,
  providesTags: (_data, id) => [{ type: "AdminDoctor", id }],
})

export const useApproveDoctorMutation = defineMutation<AdminDoctor, string>({
  query: (id) => ({ url: `/admin/doctors/${id}/approve`, method: "POST" }),
  invalidatesTags: (_result, id) => touched(id),
})

export const useRejectDoctorMutation = defineMutation<
  AdminDoctor,
  { id: string; reason: string }
>({
  query: ({ id, reason }) => ({
    url: `/admin/doctors/${id}/reject`,
    method: "POST",
    body: { reason },
  }),
  invalidatesTags: (_result, { id }) => touched(id),
})

// `doctorId` is only used to refresh that doctor's cached data.
export const useSetUserStatusMutation = defineMutation<
  { _id: string; isActive: boolean },
  { userId: string; doctorId: string; isActive: boolean }
>({
  query: ({ userId, isActive }) => ({
    url: `/admin/users/${userId}/status`,
    method: "PATCH",
    body: { isActive },
  }),
  invalidatesTags: (_result, { doctorId }) => touched(doctorId),
})
