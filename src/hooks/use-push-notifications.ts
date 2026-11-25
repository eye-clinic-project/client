"use client"

/**
 * Web push (Firebase Cloud Messaging) for this browser.
 *
 * - usePushRegistration(): mounted once per role area (PushRegistrar). Registers
 *   the device silently when permission was already granted, and handles
 *   messages while the app is open (refresh data + show a toast).
 * - usePushNotifications(): enable/disable switch for settings and the prompt.
 *
 * localStorage keeps the registered token (avoid re-registering) and an opt-out flag
 * (so a user who turned push off isn't re-registered on next visit).
 */

import { deleteToken, getToken, onMessage } from "firebase/messaging"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"

import { useUi } from "@/contexts/ui-context"
import {
  firebaseMessaging,
  SERVICE_WORKER_PATH,
  vapidKey,
} from "@/lib/firebase"
import { useQueryClient } from "@/lib/query/provider"
import {
  useRegisterDeviceMutation,
  useUnregisterDeviceMutation,
} from "@/services/user.service"

const DEVICE_TOKEN_KEY = "retinacare.deviceToken"
const OPT_OUT_KEY = "retinacare.pushOptOut"

function optedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1"
  } catch {
    return false
  }
}

function setOptOut(value: boolean) {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, "1")
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {}
}

export function storedDeviceToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY)
  } catch {
    return null
  }
}

function storeDeviceToken(token: string | null) {
  try {
    if (token) localStorage.setItem(DEVICE_TOKEN_KEY, token)
    else localStorage.removeItem(DEVICE_TOKEN_KEY)
  } catch {}
}

/** Deletes this browser's FCM token (on sign-out or when disabling push). */
export async function releaseDeviceToken() {
  const messaging = await firebaseMessaging()
  if (messaging) await deleteToken(messaging).catch(() => false)
  storeDeviceToken(null)
}

/** Registers the service worker, gets an FCM token and sends it to the backend if new. */
function useRegister() {
  const queryClient = useQueryClient()

  const register = useCallback(async () => {
    const messaging = await firebaseMessaging()
    const key = vapidKey()
    if (!messaging || !key || !("serviceWorker" in navigator)) return false

    const registration =
      await navigator.serviceWorker.register(SERVICE_WORKER_PATH)
    const token = await getToken(messaging, {
      vapidKey: key,
      serviceWorkerRegistration: registration,
    })
    if (!token) return false

    if (token !== storedDeviceToken()) {
      await useRegisterDeviceMutation.execute(queryClient, {
        token,
        platform: "web",
      })
      storeDeviceToken(token)
    }
    return true
  }, [queryClient])
  return register
}

export function usePushNotifications() {
  const queryClient = useQueryClient()
  const register = useRegister()
  const {
    pushPermission: permission,
    pushSubscribed: subscribed,
    setPushPermission,
    setPushSubscribed,
  } = useUi()

  const enable = useCallback(async () => {
    if (typeof Notification === "undefined") return false
    const result = await Notification.requestPermission()
    setPushPermission(result)
    if (result !== "granted") return false
    setOptOut(false)
    const registered = await register().catch(() => false)
    setPushSubscribed(registered)
    return registered
  }, [register, setPushPermission, setPushSubscribed])

  const disable = useCallback(async () => {
    setOptOut(true)
    const token = storedDeviceToken()
    if (token)
      await useUnregisterDeviceMutation
        .execute(queryClient, { token })
        .catch(() => undefined)
    await releaseDeviceToken()
    setPushSubscribed(false)
  }, [queryClient, setPushSubscribed])

  return { permission, subscribed, enable, disable }
}

export function usePushRegistration() {
  const queryClient = useQueryClient()
  const { setPushPermission, setPushSubscribed } = useUi()
  const register = useRegister()

  useEffect(() => {
    if (typeof Notification === "undefined" || !vapidKey()) {
      setPushPermission("unsupported")
      return
    }
    setPushPermission(Notification.permission)
    if (Notification.permission === "granted" && !optedOut()) {
      void register().then(
        (registered) => setPushSubscribed(registered),
        () => setPushSubscribed(false)
      )
    }
  }, [register, setPushPermission, setPushSubscribed])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    void firebaseMessaging().then((messaging) => {
      if (!messaging || cancelled) return
      // Foreground message (app is open). Refresh the data it is about, then toast.
      // Background messages are shown by public/firebase-messaging-sw.js instead.
      unsubscribe = onMessage(messaging, (payload) => {
        queryClient.invalidateTags(["Notification"])
        const type = payload.data?.type
        if (type === "appointment") queryClient.invalidateTags(["Appointment"])
        if (type === "analysis") queryClient.invalidateTags(["Analysis"])
        if (type === "report") queryClient.invalidateTags(["Report"])
        if (type === "message") queryClient.invalidateTags(["Conversation"])
        if (payload.notification?.title) {
          toast(payload.notification.title, {
            description: payload.notification.body,
          })
        }
      })
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [queryClient])
}
