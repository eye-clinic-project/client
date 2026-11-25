import { serverApi } from "@/lib/api/server-api"
import type { TokenPair } from "@/types/api"

/**
 * The backend rotates refresh tokens: each one works only once. If two requests
 * refresh with the same token at the same time, the second would fail and sign
 * the user out. So concurrent (and shortly repeated) rotations of the same token
 * share one backend call and get the same new token pair.
 */

/** How long a finished rotation is reused for late callers with the old token. */
const REUSE_WINDOW_MS = 2 * 60_000

interface Rotation {
  result: Promise<TokenPair>
  finishedAt?: number
}

// Stored on globalThis so dev hot reloads don't start a fresh, empty map.
const globalCache = globalThis as typeof globalThis & {
  __retinaRotations?: Map<string, Rotation>
}
const rotationsByToken = (globalCache.__retinaRotations ??= new Map<
  string,
  Rotation
>())

function forgetOldRotations(now: number) {
  for (const [token, rotation] of rotationsByToken) {
    const expired =
      rotation.finishedAt !== undefined &&
      now - rotation.finishedAt > REUSE_WINDOW_MS
    if (expired) rotationsByToken.delete(token)
  }
}

function startRotation(refreshToken: string): Rotation {
  const rotation: Rotation = {
    result: serverApi<TokenPair>("/authentication/refresh", {
      method: "POST",
      body: { refreshToken },
    }),
  }

  rotation.result.then(
    // Success: keep it for a while so late callers get the same pair.
    () => {
      rotation.finishedAt = Date.now()
    },
    // Failure: drop it so the next caller can try again.
    () => {
      rotationsByToken.delete(refreshToken)
    }
  )

  return rotation
}

/** Exchanges a refresh token for a new token pair, at most once per token. */
export function rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
  forgetOldRotations(Date.now())

  let rotation = rotationsByToken.get(refreshToken)
  if (!rotation) {
    rotation = startRotation(refreshToken)
    rotationsByToken.set(refreshToken, rotation)
  }
  return rotation.result
}
