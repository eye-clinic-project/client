"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import type { ProfileRole } from "@/lib/profile-settings"

export function useProfile(role: ProfileRole) {
  return useAppSelector((state) => state.workspace.profiles[role])
}
