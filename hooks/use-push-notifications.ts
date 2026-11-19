"use client"

import { deleteToken, getToken, onMessage } from "firebase/messaging"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"

import {
  firebaseMessaging,
  SERVICE_WORKER_PATH,
  vapidKey,
} from "@/lib/firebase"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import {
  pushPermissionChanged,
  pushSubscriptionChanged,
} from "@/redux/slices/ui.slice"
import { api } from "@/service/api"
import { userApi } from "@/service/user.service"

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

export async function releaseDeviceToken() {
  const messaging = await firebaseMessaging()
  if (messaging) await deleteToken(messaging).catch(() => false)
  storeDeviceToken(null)
}

function useRegister() {
  const dispatch = useAppDispatch()

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
      await dispatch(
        userApi.endpoints.registerDevice.initiate({ token, platform: "web" })
      ).unwrap()
      storeDeviceToken(token)
    }
    return true
  }, [dispatch])
  return register
}

export function usePushNotifications() {
  const dispatch = useAppDispatch()
  const register = useRegister()
  const permission = useAppSelector((state) => state.ui.pushPermission)
  const subscribed = useAppSelector((state) => state.ui.pushSubscribed)

  const enable = useCallback(async () => {
    if (typeof Notification === "undefined") return false
    const result = await Notification.requestPermission()
    dispatch(pushPermissionChanged(result))
    if (result !== "granted") return false
    setOptOut(false)
    const registered = await register().catch(() => false)
    dispatch(pushSubscriptionChanged(registered))
    return registered
  }, [dispatch, register])

  const disable = useCallback(async () => {
    setOptOut(true)
    const token = storedDeviceToken()
    if (token)
      await dispatch(userApi.endpoints.unregisterDevice.initiate({ token }))
    await releaseDeviceToken()
    dispatch(pushSubscriptionChanged(false))
  }, [dispatch])

  return { permission, subscribed, enable, disable }
}

export function usePushRegistration() {
  const dispatch = useAppDispatch()
  const register = useRegister()

  useEffect(() => {
    if (typeof Notification === "undefined" || !vapidKey()) {
      dispatch(pushPermissionChanged("unsupported"))
      return
    }
    dispatch(pushPermissionChanged(Notification.permission))
    if (Notification.permission === "granted" && !optedOut()) {
      void register().then(
        (registered) => dispatch(pushSubscriptionChanged(registered)),
        () => dispatch(pushSubscriptionChanged(false))
      )
    }
  }, [dispatch, register])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    void firebaseMessaging().then((messaging) => {
      if (!messaging || cancelled) return
      unsubscribe = onMessage(messaging, (payload) => {
        dispatch(api.util.invalidateTags(["Notification"]))
        const type = payload.data?.type
        if (type === "appointment")
          dispatch(api.util.invalidateTags(["Appointment"]))
        if (type === "analysis") dispatch(api.util.invalidateTags(["Analysis"]))
        if (type === "report") dispatch(api.util.invalidateTags(["Report"]))
        if (type === "message")
          dispatch(api.util.invalidateTags(["Conversation"]))
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
  }, [dispatch])
}
