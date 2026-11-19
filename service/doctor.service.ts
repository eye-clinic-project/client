import type {
  AssignedDoctor,
  DoctorClinic,
  DoctorVerification,
  Paginated,
  Patient,
  PatientSearchResult,
} from "@/types/api"
import { api } from "./api"
import type { PatientPayload } from "./patient.service"

export interface ClinicPayload {
  clinicName?: string
  clinicAddress?: string
  specialty?: string
  bio?: string
  yearsOfExperience?: number
}

export const doctorApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyVerification: build.query<DoctorVerification, void>({
      query: () => "/doctor/me/verification",
      providesTags: ["DoctorVerification"],
    }),
    submitLicense: build.mutation<DoctorVerification, FormData>({
      query: (body) => ({
        url: "/doctor/me/verification",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DoctorVerification", "Doctor"],
    }),
    getMyClinic: build.query<DoctorClinic, void>({
      query: () => "/doctor/me/clinic",
      providesTags: ["Doctor"],
    }),
    updateMyClinic: build.mutation<DoctorClinic, ClinicPayload>({
      query: (body) => ({ url: "/doctor/me/clinic", method: "PATCH", body }),
      invalidatesTags: ["Doctor"],
    }),
    listMyDoctors: build.query<AssignedDoctor[], void>({
      query: () => "/patient/me/doctors",
      providesTags: ["Doctor"],
    }),
    createClinicPatient: build.mutation<Patient, PatientPayload>({
      query: (body) => ({ url: "/doctor/patients", method: "POST", body }),
      invalidatesTags: [{ type: "Patient", id: "LIST" }],
    }),
    searchAllPatients: build.query<
      Paginated<PatientSearchResult>,
      { search: string; page?: number; size?: number }
    >({
      query: (params) => ({ url: "/doctor/patients/search", params }),
      providesTags: [{ type: "Patient", id: "SEARCH" }],
    }),
    assignPatient: build.mutation<Patient, string>({
      query: (id) => ({ url: `/doctor/patients/${id}/assign`, method: "POST" }),
      invalidatesTags: [
        { type: "Patient", id: "LIST" },
        { type: "Patient", id: "SEARCH" },
      ],
    }),
    unassignPatient: build.mutation<void, string>({
      query: (id) => ({ url: `/doctor/patients/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Patient", id: "LIST" },
        { type: "Patient", id: "SEARCH" },
      ],
    }),
  }),
})

export const {
  useGetMyVerificationQuery,
  useSubmitLicenseMutation,
  useGetMyClinicQuery,
  useUpdateMyClinicMutation,
  useListMyDoctorsQuery,
  useCreateClinicPatientMutation,
  useSearchAllPatientsQuery,
  useAssignPatientMutation,
  useUnassignPatientMutation,
} = doctorApi
