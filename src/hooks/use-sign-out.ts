"use client"

/**
 * Full sign-out. Always use this instead of calling next-auth's signOut directly:
 * it also removes the push device, closes the chat socket and clears cached data.
 * `everywhere: true` revokes all of the user's sessions on every device.
 */

import { signOut } from "next-auth/react"
import { useCallback, useState } from "react"

import { useChatActions } from "@/contexts/chat-context"
import { tokenStore } from "@/lib/auth/token-store"
import { useQueryClient } from "@/lib/query/provider"
import { chatSocket } from "@/lib/socket/chat.socket"
import {
  useLogoutEverywhereMutation,
  useUnregisterDeviceMutation,
} from "@/services/user.service"

import { releaseDeviceToken, storedDeviceToken } from "./use-push-notifications"

export function useSignOut() {
  const queryClient = useQueryClient()
  const chat = useChatActions()
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (options?: { everywhere?: boolean }) => {
      setPending(true)
      const deviceToken = storedDeviceToken()
      if (options?.everywhere) {
        await useLogoutEverywhereMutation
          .execute(queryClient, { deviceToken: deviceToken ?? undefined })
          .catch(() => undefined)
        await releaseDeviceToken()
      } else if (deviceToken) {
        await useUnregisterDeviceMutation
          .execute(queryClient, { token: deviceToken })
          .catch(() => undefined)
        await releaseDeviceToken()
      }
      chatSocket().disconnect()
      tokenStore.clear()
      await signOut({ redirectTo: "/sign-in" })
      // Clear data after leaving so the next user never sees it.
      chat.reset()
      queryClient.reset()
    },
    [chat, queryClient]
  )

  return { signOut: run, pending }
}
