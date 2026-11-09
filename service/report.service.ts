import { apiClient, downloadFile } from "./api-client"
import type { Paged, Report, ReportStatus, ReportSummary } from "@/lib/api-types"

export const reportService = {
  list: (query: { patientId?: string; status?: ReportStatus; page?: number; size?: number } = {}) =>
    apiClient<Paged<ReportSummary>>("/reports", { query }),

  create: (dto: { analysisId: string; title?: string; content?: string; recommendations?: string }) =>
    apiClient<Report>("/reports", { method: "POST", body: dto }),

  getById: (id: string) => apiClient<Report>(`/reports/${id}`),

  update: (id: string, dto: { title?: string; content?: string; recommendations?: string }) =>
    apiClient<Report>(`/reports/${id}`, { method: "PATCH", body: dto }),

  send: (id: string) => apiClient<Report>(`/reports/${id}/send`, { method: "POST" }),

  downloadPdf: (report: Pick<ReportSummary, "id" | "pdfUrl">) =>
    downloadFile(report.pdfUrl, `report-${report.id}.pdf`),
}
