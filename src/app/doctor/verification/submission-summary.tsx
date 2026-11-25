"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { DetailList } from "@/components/page/panel"
import { verificationTone } from "@/components/settings/license-section"
import { Button } from "@/components/ui/button"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { DoctorVerification } from "@/types/api"

/** What was submitted: license number, date and documents. */
export function SubmissionSummary({
  verification,
  onReplace,
}: {
  verification: DoctorVerification
  onReplace: () => void
}) {
  const t = useTranslations("verification")
  const format = useFormat()
  const errorText = useErrorText()
  const approved = verification.status === "approved"
  return (
    <div className="flex flex-col gap-5">
      <div
        role="status"
        className={cn(
          "flex flex-col gap-1 border-s-[3px] px-4 py-3 text-sm",
          approved
            ? "border-success bg-success-soft"
            : "border-warning bg-warning-soft"
        )}
      >
        <span className="font-semibold">
          {approved ? t("approvedTitle") : t("pendingTitle")}
        </span>
        <span className="leading-relaxed text-muted-foreground">
          {approved
            ? t("approvedBody", {
                date: format.date(verification.verifiedAt ?? new Date()),
              })
            : t("pendingBody", {
                date: format.dateTime(verification.submittedAt ?? new Date()),
              })}
        </span>
      </div>
      <DetailList
        items={[
          {
            label: t("number"),
            value: <span dir="ltr">{verification.licenseNumber}</span>,
          },
          {
            label: t("statusLabel"),
            value: (
              <StatusChip tone={verificationTone(verification.status)}>
                {t(`status.${verification.status ?? "none"}`)}
              </StatusChip>
            ),
          },
          {
            label: t("documents"),
            value: (
              <span className="flex flex-col gap-1">
                {verification.documents.map((document) => (
                  <button
                    key={document.index}
                    type="button"
                    dir="auto"
                    onClick={() =>
                      openProtectedFile(
                        `/doctor/me/verification/documents/${document.index}`
                      ).catch((caught: unknown) =>
                        toast.error(errorText(caught))
                      )
                    }
                    className="text-start text-brand hover:text-brand-strong hover:underline"
                  >
                    {document.originalName}
                  </button>
                ))}
              </span>
            ),
          },
        ]}
      />
      <Button
        variant="outline"
        onClick={onReplace}
        className="h-10 self-start rounded-none px-4"
      >
        {t("replace")}
      </Button>
    </div>
  )
}
