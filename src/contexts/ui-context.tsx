"use client"

/**
 * UI-level client state that the backend doesn't own.
 * `language` is also read by the request layer to send the `x-language` header,
 * through the stable `getLanguage()` (always up to date, even mid-render).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { Language } from "@/types/api"

export type PushPermission = NotificationPermission | "unsupported"

interface UiContextValue {
  language: Language
  getLanguage: () => Language
  setLanguage: (language: Language) => void
  pushPermission: PushPermission
  setPushPermission: (permission: PushPermission) => void
  pushSubscribed: boolean
  setPushSubscribed: (subscribed: boolean) => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({
  language: initialLanguage,
  children,
}: {
  language: Language
  children: ReactNode
}) {
  const [language, setLanguageState] = useState(initialLanguage)
  const languageRef = useRef(initialLanguage)
  const [pushPermission, setPushPermission] =
    useState<PushPermission>("default")
  const [pushSubscribed, setPushSubscribed] = useState(false)

  const getLanguage = useCallback(() => languageRef.current, [])
  const setLanguage = useCallback((next: Language) => {
    // Update the ref first so requests fired right after use the new language.
    languageRef.current = next
    setLanguageState(next)
  }, [])

  const value = useMemo(
    () => ({
      language,
      getLanguage,
      setLanguage,
      pushPermission,
      setPushPermission,
      pushSubscribed,
      setPushSubscribed,
    }),
    [language, getLanguage, setLanguage, pushPermission, pushSubscribed]
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiContextValue {
  const value = useContext(UiContext)
  if (!value) throw new Error("useUi must be used inside UiProvider")
  return value
}
