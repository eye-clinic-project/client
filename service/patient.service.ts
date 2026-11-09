import { apiClient } from "./api-client"
import type {
  Analysis,
  Assignment,
  AssignmentStatus,
  CreatePatientDto,
  HistoryItem,
  Paged,
  PatientDoctor,
  PatientListItem,
  PatientRecord,
  ReportSummary,
} from "@/lib/api-types"

export const patientService = {
  /** Doctors: their assigned patients. Searches name, email or patient ID (P-XXXXXX). */
  search: (query: { search?: string; page?: number; size?: number } = {}) =>
    apiClient<Paged<PatientListItem>>("/patients", { query }),

  create: (dto: CreatePatientDto) => apiClient<PatientRecord>("/patients", { method: "POST", body: dto }),

  getById: (patientId: string) => apiClient<PatientRecord>(`/patients/${patientId}`),

  doctors: (patientId: string) => apiClient<PatientDoctor[]>(`/patients/${patientId}/doctors`),

  history: (patientId: string) => apiClient<HistoryItem[]>(`/patients/${patientId}/history`),

  analyses: (patientId: string, query: { page?: number; size?: number } = {}) =>
    apiClient<Paged<Analysis>>(`/patients/${patientId}/analyses`, { query }),

  reports: (patientId: string, query: { page?: number; size?: number } = {}) =>
    apiClient<Paged<ReportSummary>>(`/patients/${patientId}/reports`, { query }),
}

export const assignmentService = {
  list: (query: { status?: AssignmentStatus; page?: number; size?: number } = {}) =>
    apiClient<Paged<Assignment>>("/doctor-patient", { query }),

  /** Doctor: link an existing patient by email (active). Patient: request a doctor (pending). */
  create: (dto: { patientEmail?: string; patientId?: string; doctorId?: string; notes?: string }) =>
    apiClient<Assignment>("/doctor-patient", { method: "POST", body: dto }),

  setStatus: (id: string, status: "active" | "ended") =>
    apiClient<Assignment>(`/doctor-patient/${id}`, { method: "PATCH", body: { status } }),
}
