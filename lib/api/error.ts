import type { ApiErrorBody } from "@/types/api"

export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]
  readonly errorCode?: string

  constructor(status: number, messages: string[], errorCode?: string) {
    super(messages[0] ?? `Request failed with status ${status}`)
    this.name = "ApiError"
    this.status = status
    this.messages = messages
    this.errorCode = errorCode
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "statusCode" in value &&
    "message" in value
  )
}

export function messagesOf(body: unknown): string[] {
  if (!isApiErrorBody(body)) return []
  return Array.isArray(body.message) ? body.message : [body.message]
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  return new ApiError(
    response.status,
    messagesOf(body),
    isApiErrorBody(body) ? body.errorCode : undefined
  )
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof ApiError) return error.message || fallback
  if (typeof error === "object" && error !== null && "data" in error) {
    const [first] = messagesOf((error as { data: unknown }).data)
    if (first) return first
    const status = (error as { status?: unknown }).status
    if (status === "FETCH_ERROR")
      return "Can't reach the server. Check your connection."
    if (status === 429)
      return "Too many attempts. Please wait a moment and try again."
  }
  return fallback
}
