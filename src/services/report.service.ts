/**
 * Reports (/report): documents a doctor writes from an analysis and sends to the patient.
 * Status: draft → sent (only sent reports are visible to the patient).
 */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type { Paginated, Report, ReportStatus } from "@/types/api"

import { listTags } from "./tags"

export interface ReportListParams {
  page?: number
  size?: number
  patientId?: string
  status?: ReportStatus
}

export interface ReportContent {
  title: string
  content?: string
  recommendations?: string
}

/** Tags to refresh after a report changes (the report itself and all report lists). */
const touched = (id: string) => [
  { type: "Report" as const, id },
  { type: "Report" as const, id: "LIST" },
]

export const useListReportsQuery = defineQuery<
  Paginated<Report>,
  ReportListParams
>({
  name: "listReports",
  query: (params) => ({ url: "/report", params }),
  providesTags: (data) => listTags("Report", data),
})

export const useGetReportQuery = defineQuery<Report, string>({
  name: "getReport",
  query: (id) => `/report/${id}`,
  providesTags: (_data, id) => [{ type: "Report", id }],
})

export const useCreateReportMutation = defineMutation<
  Report,
  ReportContent & { analysisId: string }
>({
  query: (body) => ({ url: "/report", method: "POST", body }),
  invalidatesTags: (_result, { analysisId }) => [
    { type: "Report", id: "LIST" },
    { type: "Analysis", id: analysisId },
  ],
})

export const useUpdateReportMutation = defineMutation<
  Report,
  Partial<ReportContent> & { id: string }
>({
  query: ({ id, ...body }) => ({
    url: `/report/${id}`,
    method: "PATCH",
    body,
  }),
  invalidatesTags: (_result, { id }) => touched(id),
})

// Rebuild the report text from the latest analysis/review data.
export const useRegenerateReportMutation = defineMutation<Report, string>({
  query: (id) => ({ url: `/report/${id}/regenerate`, method: "POST" }),
  invalidatesTags: (_result, id) => touched(id),
})

export const useSendReportMutation = defineMutation<Report, string>({
  query: (id) => ({ url: `/report/${id}/send`, method: "POST" }),
  invalidatesTags: (_result, id) => [
    ...touched(id),
    { type: "Review", id: "LIST" },
  ],
})

export const useDeleteReportMutation = defineMutation<void, string>({
  query: (id) => ({ url: `/report/${id}`, method: "DELETE" }),
  invalidatesTags: [{ type: "Report", id: "LIST" }],
})

// PDF download. A mutation (not a query) so the Blob is not kept in the cache.
// Use `useReportDownload()` to trigger it with a file name.
export const useDownloadReportMutation = defineMutation<Blob, string>({
  query: (id) => ({
    url: `/report/${id}/download`,
    responseType: "blob",
    cache: "no-store",
  }),
  invalidatesTags: (_result, id) => [{ type: "Report", id }],
})
