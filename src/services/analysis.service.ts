/**
 * AI analyses of fundus images (/analysis) and the doctor's review of each result.
 *
 * Lifecycle: createAnalysis (upload) → backend processes it
 * (pending → processing → completed | failed) → doctor saves a review.
 */

import { HttpError } from "@/lib/api/request"
import { defineMutation, defineQuery } from "@/lib/query/define"
import type {
  AiHealth,
  Analysis,
  AnalysisStatus,
  DrLevel,
  Paginated,
  Review,
} from "@/types/api"

import { listTags } from "./tags"

export interface AnalysisListParams {
  page?: number
  size?: number
  patientId?: string
  status?: AnalysisStatus
  hasDR?: boolean
  reviewed?: boolean
}

export interface ReviewPayload {
  aiResultConfirmed: boolean
  confirmedLevel: DrLevel
  notes?: string
  recommendations?: string
  followUpDate?: string
}

export const useListAnalysesQuery = defineQuery<
  Paginated<Analysis>,
  AnalysisListParams
>({
  name: "listAnalyses",
  query: (params) => ({ url: "/analysis", params }),
  providesTags: (data) => listTags("Analysis", data),
})

export const useGetAnalysisQuery = defineQuery<Analysis, string>({
  name: "getAnalysis",
  query: (id) => `/analysis/${id}`,
  providesTags: (_data, id) => [{ type: "Analysis", id }],
})

// Status of the AI service (shown so doctors know if uploads will be processed).
export const useGetAiHealthQuery = defineQuery<AiHealth, void>({
  name: "getAiHealth",
  query: () => "/analysis/health",
  providesTags: ["AiHealth"],
})

export const useCreateAnalysisMutation = defineMutation<
  Analysis | null,
  FormData
>({
  query: (body) => ({ url: "/analysis", method: "POST", body }),
  invalidatesTags: [{ type: "Analysis", id: "LIST" }],
})

// Re-queue a failed analysis.
export const useRetryAnalysisMutation = defineMutation<Analysis | null, string>(
  {
    query: (id) => ({ url: `/analysis/${id}/retry`, method: "POST" }),
    invalidatesTags: (_result, id) => [
      { type: "Analysis", id },
      { type: "Analysis", id: "LIST" },
    ],
  }
)

export const useDeleteAnalysisMutation = defineMutation<void, string>({
  query: (id) => ({ url: `/analysis/${id}`, method: "DELETE" }),
  invalidatesTags: [{ type: "Analysis", id: "LIST" }],
})

// A 404 means "not reviewed yet", which is a normal state → return null.
export const useGetReviewQuery = defineQuery<Review | null, string>({
  name: "getReview",
  async queryFn(id, request) {
    try {
      return await request<Review>(`/analysis/${id}/review`)
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return null
      throw error
    }
  },
  providesTags: (_data, id) => [{ type: "Review", id }],
})

// Creates (POST) or updates (PATCH) the review depending on `exists`.
export const useSaveReviewMutation = defineMutation<
  Review,
  { analysisId: string; exists: boolean; body: ReviewPayload }
>({
  query: ({ analysisId, exists, body }) => ({
    url: `/analysis/${analysisId}/review`,
    method: exists ? "PATCH" : "POST",
    body,
  }),
  invalidatesTags: (_result, { analysisId }) => [
    { type: "Review", id: analysisId },
    { type: "Analysis", id: analysisId },
    { type: "Analysis", id: "LIST" },
  ],
})
