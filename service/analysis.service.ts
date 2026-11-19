import type {
  AiHealth,
  Analysis,
  AnalysisStatus,
  DrLevel,
  Paginated,
  Review,
} from "@/types/api"
import { api } from "./api"
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

export const analysisApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAnalyses: build.query<Paginated<Analysis>, AnalysisListParams>({
      query: (params) => ({ url: "/analysis", params }),
      providesTags: (result) => listTags("Analysis", result),
    }),
    getAnalysis: build.query<Analysis, string>({
      query: (id) => `/analysis/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Analysis", id }],
    }),
    getAiHealth: build.query<AiHealth, void>({
      query: () => "/analysis/health",
      providesTags: ["AiHealth"],
    }),
    createAnalysis: build.mutation<Analysis | null, FormData>({
      query: (body) => ({ url: "/analysis", method: "POST", body }),
      invalidatesTags: [{ type: "Analysis", id: "LIST" }],
    }),
    retryAnalysis: build.mutation<Analysis | null, string>({
      query: (id) => ({ url: `/analysis/${id}/retry`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Analysis", id },
        { type: "Analysis", id: "LIST" },
      ],
    }),
    deleteAnalysis: build.mutation<void, string>({
      query: (id) => ({ url: `/analysis/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Analysis", id: "LIST" }],
    }),
    getReview: build.query<Review | null, string>({
      async queryFn(id, _api, _extra, baseQuery) {
        const result = await baseQuery(`/analysis/${id}/review`)
        if (result.error?.status === 404) return { data: null }
        if (result.error) return { error: result.error }
        return { data: result.data as Review }
      },
      providesTags: (_result, _error, id) => [{ type: "Review", id }],
    }),
    saveReview: build.mutation<
      Review,
      { analysisId: string; exists: boolean; body: ReviewPayload }
    >({
      query: ({ analysisId, exists, body }) => ({
        url: `/analysis/${analysisId}/review`,
        method: exists ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { analysisId }) => [
        { type: "Review", id: analysisId },
        { type: "Analysis", id: analysisId },
        { type: "Analysis", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useListAnalysesQuery,
  useGetAnalysisQuery,
  useGetAiHealthQuery,
  useCreateAnalysisMutation,
  useRetryAnalysisMutation,
  useDeleteAnalysisMutation,
  useGetReviewQuery,
  useSaveReviewMutation,
} = analysisApi
