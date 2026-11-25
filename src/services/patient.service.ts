/** Patient records (/patient). Doctors list/edit their patients; patients read their own record (`/patient/me`). */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type { Gender, Paginated, Patient } from "@/types/api"

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

/** Email can't be changed after creation. */
export type PatientUpdate = Partial<Omit<PatientPayload, "email">>

export const useListPatientsQuery = defineQuery<
  Paginated<Patient>,
  { page?: number; size?: number; search?: string }
>({
  name: "listPatients",
  query: (params) => ({ url: "/patient", params }),
  providesTags: (data) => listTags("Patient", data),
})

export const useGetPatientQuery = defineQuery<Patient, string>({
  name: "getPatient",
  query: (id) => `/patient/${id}`,
  providesTags: (_data, id) => [{ type: "Patient", id }],
})

export const useGetMyPatientRecordQuery = defineQuery<Patient, void>({
  name: "getMyPatientRecord",
  query: () => "/patient/me",
  providesTags: [{ type: "Patient", id: "ME" }],
})

export const useUpdatePatientMutation = defineMutation<
  Patient,
  PatientUpdate & { id: string }
>({
  query: ({ id, ...body }) => ({
    url: `/patient/${id}`,
    method: "PATCH",
    body,
  }),
  invalidatesTags: (_result, { id }) => [
    { type: "Patient", id },
    { type: "Patient", id: "LIST" },
  ],
})
