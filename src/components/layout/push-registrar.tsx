"use client"

/** Mounts push registration for the signed-in area (see usePushRegistration). Renders nothing. */

import { usePushRegistration } from "@/hooks/use-push-notifications"

export function PushRegistrar() {
  usePushRegistration()
  return null
}
