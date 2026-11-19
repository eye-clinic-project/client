import { serverApi } from "@/lib/api/server-api"
import type { TokenPair } from "@/types/api"

const GRACE_MS = 2 * 60_000

interface Rotation {
  promise: Promise<TokenPair>
  settledAt?: number
}

const globalStore = globalThis as typeof globalThis & {
  __retinaRotations?: Map<string, Rotation>
}

const rotations = (globalStore.__retinaRotations ??= new Map())

function sweep(now: number) {
  for (const [key, rotation] of rotations) {
    if (rotation.settledAt && now - rotation.settledAt > GRACE_MS)
      rotations.delete(key)
  }
}

export function rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
  sweep(Date.now())

  const existing = rotations.get(refreshToken)
  if (existing) return existing.promise

  const rotation: Rotation = {
    promise: serverApi<TokenPair>("/token/refresh", {
      method: "POST",
      body: { refreshToken },
    }),
  }
  rotations.set(refreshToken, rotation)

  rotation.promise.then(
    () => {
      rotation.settledAt = Date.now()
    },
    () => {
      rotations.delete(refreshToken)
    }
  )

  return rotation.promise
}
