/**
 * Lazy Firebase setup for web push (FCM). Everything returns null when push is
 * not configured or the browser doesn't support it, so callers can just bail out.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getMessaging, isSupported, type Messaging } from "firebase/messaging"

import { publicEnv } from "@/lib/env"

/** Must match the file in public/ and be excluded in proxy.ts's matcher. */
export const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js"

/** Reuses the existing app on hot reload / repeated calls. */
function firebaseApp(): FirebaseApp | null {
  const config = publicEnv.firebase
  if (!config) return null
  if (getApps().length) return getApp()
  return initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    measurementId: config.measurementId,
  })
}

export async function firebaseMessaging(): Promise<Messaging | null> {
  if (
    typeof window === "undefined" ||
    !(await isSupported().catch(() => false))
  )
    return null
  const app = firebaseApp()
  return app ? getMessaging(app) : null
}

export function vapidKey(): string | null {
  return publicEnv.firebase?.vapidKey ?? null
}
