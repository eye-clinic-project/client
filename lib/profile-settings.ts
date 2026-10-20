export type ProfileRole = "doctor" | "patient"

export type ProfileData = {
  name: string
  email: string
  avatar: string | null
}

export const defaultProfiles: Record<ProfileRole, ProfileData> = {
  doctor: {
    name: "Dr. Taylor",
    email: "taylor@example.com",
    avatar: null,
  },
  patient: {
    name: "Alex Morgan",
    email: "alex@example.com",
    avatar: null,
  },
}

export function profileStorageKey(role: ProfileRole) {
  return `retinacare-profile-${role}`
}
