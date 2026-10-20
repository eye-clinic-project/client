"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Provider } from "react-redux"

import { defaultProfiles, profileStorageKey, type ProfileData, type ProfileRole } from "@/lib/profile-settings"
import { profilesHydrated } from "@/lib/redux/features/workspace/workspaceSlice"
import { makeStore, type AppStore } from "@/lib/redux/store"

function readStoredProfile(role: ProfileRole): ProfileData | null {
  try {
    const serializedProfile = window.localStorage.getItem(
      profileStorageKey(role)
    )
    if (!serializedProfile) return null

    const value: unknown = JSON.parse(serializedProfile)
    if (
      typeof value === "object" &&
      value !== null &&
      "name" in value &&
      typeof value.name === "string" &&
      "email" in value &&
      typeof value.email === "string" &&
      "avatar" in value &&
      (typeof value.avatar === "string" || value.avatar === null)
    ) {
      return {
        name: value.name,
        email: value.email,
        avatar: value.avatar,
      }
    }
  } catch {
    return defaultProfiles[role]
  }

  return null
}

function ProfileHydration({ store }: { store: AppStore }) {
  useEffect(() => {
    const doctor = readStoredProfile("doctor")
    const patient = readStoredProfile("patient")

    store.dispatch(
      profilesHydrated({
        ...(doctor && { doctor }),
        ...(patient && { patient }),
      })
    )
  }, [store])

  return null
}

function useStore() {
  const [store] = useState(makeStore)
  return store
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  const store = useStore()

  return (
    <Provider store={store}>
      <ProfileHydration store={store} />
      {children}
    </Provider>
  )
}
