import { apiClient } from "./api-client"
import type {
  Appointment,
  DoctorDashboard,
  DoctorProfile,
  Paged,
  PatientListItem,
  UserWithProfile,
} from "@/lib/api-types"

export const doctorService = {
  dashboard: () => apiClient<DoctorDashboard>("/doctors/me/dashboard"),

  search: (query: { search?: string; city?: string; specialty?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<UserWithProfile<DoctorProfile>>>("/doctors", { query }),

  getById: (doctorId: string) => apiClient<UserWithProfile<DoctorProfile>>(`/doctors/${doctorId}`),

  patients: (doctorId: string, query: { search?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<PatientListItem>>(`/doctors/${doctorId}/patients`, { query }),

  appointments: (doctorId: string) => apiClient<Paged<Appointment>>(`/doctors/${doctorId}/appointments`),
}
