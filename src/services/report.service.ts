import type { Paginated, Report, ReportStatus } from "@/types/api"
import { api } from "./api"
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

const touched = (id: string) => [
  { type: "Report" as const, id },
  { type: "Report" as const, id: "LIST" },
]

export const reportApi = api.injectEndpoints({
  endpoints: (build) => ({
    listReports: build.query<Paginated<Report>, ReportListParams>({
      query: (params) => ({ url: "/report", params }),
      providesTags: (result) => listTags("Report", result),
    }),
    getReport: build.query<Report, string>({
      query: (id) => `/report/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Report", id }],
    }),
    createReport: build.mutation<
      Report,
      ReportContent & { analysisId: string }
    >({
      query: (body) => ({ url: "/report", method: "POST", body }),
      invalidatesTags: (result, _error, { analysisId }) => [
        { type: "Report", id: "LIST" },
        { type: "Analysis", id: analysisId },
      ],
    }),
    updateReport: build.mutation<
      Report,
      Partial<ReportContent> & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/report/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => touched(id),
    }),
    regenerateReport: build.mutation<Report, string>({
      query: (id) => ({ url: `/report/${id}/regenerate`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => touched(id),
    }),
    sendReport: build.mutation<Report, string>({
      query: (id) => ({ url: `/report/${id}/send`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        ...touched(id),
        { type: "Review", id: "LIST" },
      ],
    }),
    deleteReport: build.mutation<void, string>({
      query: (id) => ({ url: `/report/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Report", id: "LIST" }],
    }),
    downloadReport: build.mutation<Blob, string>({
      query: (id) => ({
        url: `/report/${id}/download`,
        responseHandler: (response) => response.blob(),
        cache: "no-store",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Report", id }],
    }),
  }),
})

export const {
  useListReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useRegenerateReportMutation,
  useSendReportMutation,
  useDeleteReportMutation,
  useDownloadReportMutation,
} = reportApi
