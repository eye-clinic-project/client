function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  )
  return JSON.parse(atob(padded))
}

export function accessTokenExpiry(
  accessToken: string,
  expiresInSeconds: number
): number {
  try {
    const payload = decodeSegment(accessToken.split(".")[1] ?? "")
    if (typeof payload === "object" && payload !== null && "exp" in payload) {
      const exp = (payload as { exp: unknown }).exp
      if (typeof exp === "number") return exp * 1000
    }
  } catch {}
  return Date.now() + expiresInSeconds * 1000
}
