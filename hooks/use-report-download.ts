"use client"

import { toast } from "sonner"

import { useErrorText } from "@/lib/i18n/use-error-text"
import { useDownloadReportMutation } from "@/service/report.service"
import type { Report } from "@/types/api"
import { downloadBlob } from "@/util/format"

export function useReportDownload() {
  const errorText = useErrorText()
  const [download, { isLoading, originalArgs }] = useDownloadReportMutation()
  const run = async (report: Pick<Report, "_id" | "title">) => {
    try {
      const blob = await download(report._id).unwrap()
      downloadBlob(
        blob,
        `${report.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "report"}.pdf`
      )
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }
  return { download: run, pendingId: isLoading ? originalArgs : undefined }
}
