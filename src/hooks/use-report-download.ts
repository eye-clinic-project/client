"use client"

/** Downloads a report PDF with a safe file name. `pendingId` is the id being downloaded (for spinners). */

import { toast } from "sonner"

import { downloadBlob } from "@/lib/format"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useDownloadReportMutation } from "@/services/report.service"
import type { Report } from "@/types/api"

export function useReportDownload() {
  const errorText = useErrorText()
  const [download, { isLoading, originalArgs }] = useDownloadReportMutation()
  const run = async (report: Pick<Report, "_id" | "title">) => {
    try {
      const blob = await download(report._id).unwrap()
      downloadBlob(
        blob,
        // Strip characters that are invalid in file names.
        `${report.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "report"}.pdf`
      )
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }
  return { download: run, pendingId: isLoading ? originalArgs : undefined }
}
