"use client"

/**
 * Finds the patient record that belongs to a user reference.
 * Some API objects only carry the user (UserRef); the patient record is looked up by email.
 */

import { useListPatientsQuery } from "@/services/patient.service"
import type { UserRef } from "@/types/api"

export function usePatientByUser(user: UserRef | null | undefined) {
  const { data, isLoading } = useListPatientsQuery(
    { search: user?.email ?? "", size: 5 },
    { skip: !user?.email }
  )
  const patient = data?.docs.find((item) => item.user._id === user?._id) ?? null
  return { patient, isLoading }
}
