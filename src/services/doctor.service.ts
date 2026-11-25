/**
 * Doctor-side endpoints: license verification, clinic profile, and managing
 * which patients belong to the doctor. Also `listMyDoctors` for patients.
 */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type {
  AssignedDoctor,
  DoctorClinic,
  DoctorVerification,
  Paginated,
  Patient,
  PatientSearchResult,
} from "@/types/api"

import type { PatientPayload } from "./patient.service"

export interface ClinicPayload {
  clinicName?: string
  clinicAddress?: string
  specialty?: string
  bio?: string
  yearsOfExperience?: number
}

export const useGetMyVerificationQuery = defineQuery<DoctorVerification, void>({
  name: "getMyVerification",
  query: () => "/doctor/me/verification",
  providesTags: ["DoctorVerification"],
})

// Upload license number + documents (FormData). Resets status to pending.
export const useSubmitLicenseMutation = defineMutation<
  DoctorVerification,
  FormData
>({
  query: (body) => ({
    url: "/doctor/me/verification",
    method: "PUT",
    body,
  }),
  invalidatesTags: ["DoctorVerification", "Doctor"],
})

export const useGetMyClinicQuery = defineQuery<DoctorClinic, void>({
  name: "getMyClinic",
  query: () => "/doctor/me/clinic",
  providesTags: ["Doctor"],
})

export const useUpdateMyClinicMutation = defineMutation<
  DoctorClinic,
  ClinicPayload
>({
  query: (body) => ({ url: "/doctor/me/clinic", method: "PATCH", body }),
  invalidatesTags: ["Doctor"],
})

// Patient: doctors assigned to me.
export const useListMyDoctorsQuery = defineQuery<AssignedDoctor[], void>({
  name: "listMyDoctors",
  query: () => "/patient/me/doctors",
  providesTags: ["Doctor"],
})

// Create a brand-new patient account owned by this doctor.
export const useCreateClinicPatientMutation = defineMutation<
  Patient,
  PatientPayload
>({
  query: (body) => ({ url: "/doctor/patients", method: "POST", body }),
  invalidatesTags: [{ type: "Patient", id: "LIST" }],
})

// Search every patient in the system (to assign an existing one).
export const useSearchAllPatientsQuery = defineQuery<
  Paginated<PatientSearchResult>,
  { search: string; page?: number; size?: number }
>({
  name: "searchAllPatients",
  query: (params) => ({ url: "/doctor/patients/search", params }),
  providesTags: [{ type: "Patient", id: "SEARCH" }],
})

export const useAssignPatientMutation = defineMutation<Patient, string>({
  query: (id) => ({ url: `/doctor/patients/${id}/assign`, method: "POST" }),
  invalidatesTags: [
    { type: "Patient", id: "LIST" },
    { type: "Patient", id: "SEARCH" },
  ],
})

export const useUnassignPatientMutation = defineMutation<void, string>({
  query: (id) => ({ url: `/doctor/patients/${id}`, method: "DELETE" }),
  invalidatesTags: [
    { type: "Patient", id: "LIST" },
    { type: "Patient", id: "SEARCH" },
  ],
})
