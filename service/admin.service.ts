import type {
  AdminDoctor,
  DoctorVerificationStatus,
  Paginated,
} from "@/types/api"
import { api } from "./api"
import { listTags } from "./tags"

export interface AdminDoctorListParams {
  status?: DoctorVerificationStatus
  submitted?: boolean
  search?: string
  page?: number
  size?: number
}

const touched = (id: string) => [
  { type: "AdminDoctor" as const, id },
  { type: "AdminDoctor" as const, id: "LIST" },
]

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAdminDoctors: build.query<
      Paginated<AdminDoctor>,
      AdminDoctorListParams
    >({
      query: (params) => ({ url: "/admin/doctors", params }),
      providesTags: (result) => listTags("AdminDoctor", result),
    }),
    getAdminDoctor: build.query<AdminDoctor, string>({
      query: (id) => `/admin/doctors/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminDoctor", id }],
    }),
    approveDoctor: build.mutation<AdminDoctor, string>({
      query: (id) => ({ url: `/admin/doctors/${id}/approve`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => touched(id),
    }),
    rejectDoctor: build.mutation<AdminDoctor, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/doctors/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => touched(id),
    }),
    setUserStatus: build.mutation<
      { _id: string; isActive: boolean },
      { userId: string; doctorId: string; isActive: boolean }
    >({
      query: ({ userId, isActive }) => ({
        url: `/admin/users/${userId}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { doctorId }) => touched(doctorId),
    }),
  }),
})

export const {
  useListAdminDoctorsQuery,
  useGetAdminDoctorQuery,
  useApproveDoctorMutation,
  useRejectDoctorMutation,
  useSetUserStatusMutation,
} = adminApi
