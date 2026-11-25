import { tokenStore } from "@/lib/auth/token-store"
import { publicEnv } from "@/lib/env"
import { toApiError } from "./error"

export async function fetchProtectedFile(path: string): Promise<Blob> {
  await tokenStore.ensureFresh()
  const request = () =>
    fetch(path.startsWith("http") ? path : `${publicEnv.apiUrl}${path}`, {
      headers: tokenStore.get()
        ? { authorization: `Bearer ${tokenStore.get()}` }
        : undefined,
      cache: "no-store",
    })
  let response = await request()
  if (response.status === 401 && (await tokenStore.forceRefresh())) {
    response = await request()
  }
  if (!response.ok) throw await toApiError(response)
  return response.blob()
}

export async function openProtectedFile(path: string) {
  const popup = window.open("", "_blank")
  try {
    const blob = await fetchProtectedFile(path)
    const url = URL.createObjectURL(blob)
    if (popup) popup.location.href = url
    else window.open(url, "_blank", "noopener")
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    popup?.close()
    throw error
  }
}
