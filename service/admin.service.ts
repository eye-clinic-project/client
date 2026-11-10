import { apiClient } from "./api-client"
import type { AdminDashboard, AdminDoctor, ApiUser, DoctorVerificationStatus, Paged, UserRole, UserWithProfile } from "@/lib/api-types"

export const adminService = {
  dashboard: () => apiClient<AdminDashboard>("/admin/dashboard"),

  /** Doctors for license review, oldest submission first. */
  doctors: (query: { status?: DoctorVerificationStatus; search?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<AdminDoctor>>("/admin/doctors", { query }),

  approveDoctor: (userId: string) =>
    apiClient<AdminDoctor>(`/admin/doctors/${userId}/verification`, { method: "PATCH", body: { status: "approved" } }),

  rejectDoctor: (userId: string, reason: string) =>
    apiClient<AdminDoctor>(`/admin/doctors/${userId}/verification`, {
      method: "PATCH",
      body: { status: "rejected", reason },
    }),

  users: (query: { role?: UserRole; isActive?: boolean; search?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<ApiUser>>("/admin/users", { query }),

  user: (userId: string) => apiClient<UserWithProfile<unknown>>(`/admin/users/${userId}`),

  setActive: (userId: string, isActive: boolean) =>
    apiClient<ApiUser>(`/admin/users/${userId}/status`, { method: "PATCH", body: { isActive } }),
}
