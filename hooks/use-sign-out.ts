"use client"

import { signOut } from "next-auth/react"
import { useCallback, useState } from "react"

import { tokenStore } from "@/lib/auth/token-store"
import { useAppDispatch } from "@/redux/hooks"
import { chatReset } from "@/redux/slices/chat.slice"
import { api } from "@/service/api"
import { userApi } from "@/service/user.service"
import { chatSocket } from "@/socket/chat.socket"
import { releaseDeviceToken, storedDeviceToken } from "./use-push-notifications"

export function useSignOut() {
  const dispatch = useAppDispatch()
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (options?: { everywhere?: boolean }) => {
      setPending(true)
      const deviceToken = storedDeviceToken()
      if (options?.everywhere) {
        await dispatch(
          userApi.endpoints.logoutEverywhere.initiate({
            deviceToken: deviceToken ?? undefined,
          })
        )
        await releaseDeviceToken()
      } else if (deviceToken) {
        await dispatch(
          userApi.endpoints.unregisterDevice.initiate({ token: deviceToken })
        )
        await releaseDeviceToken()
      }
      chatSocket().disconnect()
      tokenStore.clear()
      await signOut({ redirectTo: "/sign-in" })
      dispatch(chatReset())
      dispatch(api.util.resetApiState())
    },
    [dispatch]
  )

  return { signOut: run, pending }
}
