import type { Gender, Paginated, Patient } from "@/types/api"
import { api } from "./api"
import { listTags } from "./tags"

export interface PatientPayload {
  name: string
  email: string
  city: string
  phone?: string
  dateOfBirth?: string
  gender?: Gender
  emergencyContact?: string
  diabetesSince?: number
  medicalNotes?: string
}

export type PatientUpdate = Partial<Omit<PatientPayload, "email">>

export const patientApi = api.injectEndpoints({
  endpoints: (build) => ({
    listPatients: build.query<
      Paginated<Patient>,
      { page?: number; size?: number; search?: string }
    >({
      query: (params) => ({ url: "/patient", params }),
      providesTags: (result) => listTags("Patient", result),
    }),
    getPatient: build.query<Patient, string>({
      query: (id) => `/patient/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Patient", id }],
    }),
    getMyPatientRecord: build.query<Patient, void>({
      query: () => "/patient/me",
      providesTags: [{ type: "Patient", id: "ME" }],
    }),
    updatePatient: build.mutation<Patient, PatientUpdate & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/patient/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Patient", id },
        { type: "Patient", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useListPatientsQuery,
  useGetPatientQuery,
  useGetMyPatientRecordQuery,
  useUpdatePatientMutation,
} = patientApi
