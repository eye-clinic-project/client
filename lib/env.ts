import { z } from "zod"

const publicSchema = z.object({
  apiUrl: z.url(),
  socketUrl: z.url(),
  firebase: z
    .object({
      apiKey: z.string().min(1),
      authDomain: z.string().min(1),
      projectId: z.string().min(1),
      storageBucket: z.string().min(1),
      messagingSenderId: z.string().min(1),
      appId: z.string().min(1),
      measurementId: z.string().optional(),
      vapidKey: z.string().min(1),
    })
    .nullable(),
})

const firebaseValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
}

export const publicEnv = publicSchema.parse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9090",
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:9090",
  firebase:
    firebaseValues.apiKey && firebaseValues.vapidKey ? firebaseValues : null,
})

export function serverApiUrl(): string {
  return process.env.API_URL ?? publicEnv.apiUrl
}
