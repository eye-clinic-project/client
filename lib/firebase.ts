import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getMessaging, isSupported, type Messaging } from "firebase/messaging"

import { publicEnv } from "@/lib/env"

export const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js"

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
