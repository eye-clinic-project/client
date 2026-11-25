"use client"

/** Settings → License (doctors): verification status and submitted documents, with a link to resubmit. */

import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { DetailList, Panel } from "@/components/page/panel"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import type { DoctorVerification } from "@/types/api"

/** Chip color for a verification status (null = never submitted). */
export function verificationTone(status: DoctorVerification["status"]) {
  return status === "approved"
    ? "success"
    : status === "rejected"
      ? "danger"
      : status === "pending"
        ? "warning"
        : "neutral"
}

export function LicenseSection({
  verification,
}: {
  verification: DoctorVerification
}) {
  const t = useTranslations("settings.license")
  const tv = useTranslations("verification")
  const tc = useTranslations("common")
  const format = useFormat()
  const errorText = useErrorText()
  const status = verification.status
  const headline =
    status === "approved"
      ? t("approved")
      : status === "rejected"
        ? t("rejected")
        : verification.submittedAt
          ? t("pending")
          : t("missing")

  return (
    <Panel id="license" title={t("title")} bodyClassName="gap-5">
      <div
        role="status"
        className={cn(
          "flex flex-col gap-1 border-s-[3px] px-4 py-3 text-sm",
          status === "approved"
            ? "border-success bg-success-soft"
            : status === "rejected"
              ? "border-danger bg-danger-soft"
              : "border-warning bg-warning-soft"
        )}
      >
        <span className="font-semibold">{headline}</span>
        {status === "approved" && verification.verifiedAt && (
          <span className="leading-relaxed text-muted-foreground">
            {t("approvedBody", { date: format.date(verification.verifiedAt) })}
          </span>
        )}
        {status === "rejected" && verification.rejectionReason && (
          <span className="text-muted-foreground">
            “{verification.rejectionReason}”
          </span>
        )}
      </div>
      <DetailList
        items={[
          {
            label: t("number"),
            value: verification.licenseNumber ? (
              <span dir="ltr">{verification.licenseNumber}</span>
            ) : (
              tc("none")
            ),
          },
          {
            label: t("status"),
            value: (
              <StatusChip tone={verificationTone(status)}>
                {tv(`status.${status ?? "none"}`)}
              </StatusChip>
            ),
          },
          {
            label: t("documents"),
            value:
              verification.documents.length === 0 ? (
                tc("none")
              ) : (
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
      <Link
        href="/doctor/verification"
        className="self-start text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {t("view")}
      </Link>
    </Panel>
  )
}
