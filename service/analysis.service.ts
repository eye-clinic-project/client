import { apiClient } from "./api-client"
import type {
  Analysis,
  AnalysisHistoryEntry,
  AnalysisStatus,
  DoctorReview,
  EyeSide,
  Paged,
  ReviewDto,
  UploadResult,
} from "@/lib/api-types"

export const imageService = {
  upload: (input: { file: File; patientId: string; eye: EyeSide; notes?: string; analyze: boolean }) => {
    const form = new FormData()
    form.append("file", input.file)
    form.append("patientId", input.patientId)
    form.append("eye", input.eye)
    if (input.notes) form.append("notes", input.notes)
    form.append("analyze", String(input.analyze))
    return apiClient<UploadResult>("/fundus-images", { method: "POST", body: form })
  },
}

export const analysisService = {
  list: (query: { patientId?: string; status?: AnalysisStatus; page?: number; size?: number } = {}) =>
    apiClient<Paged<Analysis>>("/analyses", { query }),

  getById: (id: string) => apiClient<Analysis>(`/analyses/${id}`),

  /** Creates a pending analysis for an uploaded image; run it with predict(). */
  create: (imageId: string) => apiClient<Analysis>("/analyses", { method: "POST", body: { imageId } }),

  history: (id: string) => apiClient<AnalysisHistoryEntry[]>(`/analyses/${id}/history`),

  predict: (id: string) => apiClient<Analysis>(`/analyses/${id}/predict`, { method: "POST" }),

  retry: (id: string) => apiClient<Analysis>(`/analyses/${id}/retry`, { method: "POST" }),
}

export const reviewService = {
  list: (query: { analysisId?: string; patientId?: string } = {}) =>
    apiClient<Paged<DoctorReview>>("/doctor-reviews", { query }),

  create: (dto: ReviewDto) => apiClient<DoctorReview>("/doctor-reviews", { method: "POST", body: dto }),

  update: (id: string, dto: Partial<ReviewDto>) => {
    const { analysisId, ...fields } = dto
    void analysisId
    return apiClient<DoctorReview>(`/doctor-reviews/${id}`, { method: "PATCH", body: fields })
  },
}
