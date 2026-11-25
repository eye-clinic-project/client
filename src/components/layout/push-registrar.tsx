"use client"

import { usePushRegistration } from "@/hooks/use-push-notifications"

export function PushRegistrar() {
  usePushRegistration()
  return null
}
