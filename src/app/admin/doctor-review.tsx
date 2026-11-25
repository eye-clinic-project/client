"use client"

/**
 * Review of one doctor: account, clinic and license details, the uploaded
 * license documents (protected files), and admin decisions:
 * approve, reject (with reason), and activate/deactivate the account.
 */

import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { PdfPreview } from "@/components/common/pdf-preview"
import { ProtectedImage } from "@/components/common/protected-image"
import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { verificationTone } from "@/components/settings/license-section"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { openProtectedFile } from "@/lib/api/protected-file"
import { formatBytes } from "@/lib/format"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import { useGetAdminDoctorQuery } from "@/services/admin.service"

import { Decisions, type DecisionDialog } from "./doctor-decisions"

export function DoctorReview({
  id,
  onBack,
}: {
  id: string
  onBack: () => void
}) {
  const t = useTranslations("admin")
  const tv = useTranslations("verification")
  const tc = useTranslations("common")
  const format = useFormat()
  const {
    data: doctor,
    isLoading,
    isError,
    refetch,
  } = useGetAdminDoctorQuery(id)
  const [dialog, setDialog] = useState<DecisionDialog>(null)
  const [documentIndex, setDocumentIndex] = useState(0)

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-none" />
  if (isError || !doctor) return <ErrorState onRetry={refetch} />

  const document = doctor.documents[documentIndex] ?? doctor.documents[0]
  const documentPath = document
    ? `/admin/doctors/${doctor._id}/documents/${document.index}`
    : null
  const canDecide = Boolean(doctor.submittedAt) && doctor.status !== "approved"
  const canReject = Boolean(doctor.submittedAt) && doctor.status !== "rejected"

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground xl:hidden"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <UserAvatar
            name={doctor.name}
            src={doctor.avatarUrl}
            className="size-14 text-base"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate text-xl font-semibold">
              {tc("doctorName", { name: doctor.name })}
            </h2>
            <span className="flex flex-wrap items-center gap-2">
              <StatusChip tone={verificationTone(doctor.status)}>
                {tv(`status.${doctor.status ?? "none"}`)}
              </StatusChip>
              {!doctor.isActive && (
                <StatusChip tone="danger">{t("inactive")}</StatusChip>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReject && (
            <Button
              variant="outline"
              onClick={() => setDialog("reject")}
              className="h-10 rounded-none px-4 text-danger hover:text-danger"
            >
              {t("reject")}
            </Button>
          )}
          {canDecide && (
            <Button
              onClick={() => setDialog("approve")}
              className="h-10 rounded-none px-4"
            >
              {t("approve")}
            </Button>
          )}
        </div>
      </div>
      {doctor.status === "rejected" && doctor.rejectionReason && (
        <div
          role="status"
          className="border-s-[3px] border-danger bg-danger-soft px-4 py-3 text-sm"
        >
          <span className="font-semibold">{t("rejectionReason")}: </span>“
          {doctor.rejectionReason}”
        </div>
      )}
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title={t("documents")}
          action={
            documentPath && (
              <button
                type="button"
                onClick={() =>
                  openProtectedFile(documentPath).catch(() =>
                    toast.error(t("documentError"))
                  )
                }
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-strong"
              >
                <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                {t("openDocument")}
              </button>
            )
          }
          bodyClassName="gap-3"
        >
          {doctor.documents.length === 0 || !document || !documentPath ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noDocuments")}
            </p>
          ) : (
            <>
              {doctor.documents.length > 1 && (
                <div
                  role="tablist"
                  aria-label={t("documents")}
                  className="flex flex-wrap gap-2"
                >
                  {doctor.documents.map((item, index) => (
                    <button
                      key={item.index}
                      type="button"
                      role="tab"
                      aria-selected={index === documentIndex}
                      onClick={() => setDocumentIndex(index)}
                      className={cn(
                        "max-w-56 truncate border px-3 py-1.5 text-[13px]",
                        index === documentIndex
                          ? "border-primary bg-brand-soft font-semibold"
                          : "border-border hover:bg-muted"
                      )}
                      dir="auto"
                    >
                      {item.originalName}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-subtle" dir="auto">
                {document.originalName} ·{" "}
                <span dir="ltr">{formatBytes(document.size)}</span> ·{" "}
                {format.dateTime(document.uploadedAt)}
              </p>
              {document.mimeType === "application/pdf" ? (
                <PdfPreview
                  key={documentPath}
                  path={documentPath}
                  title={document.originalName}
                  emptyText={t("noDocuments")}
                  errorText={t("documentError")}
                />
              ) : (
                <ProtectedImage
                  key={documentPath}
                  path={documentPath}
                  alt={document.originalName}
                  className="max-h-[70vh] w-full bg-muted object-contain"
                />
              )}
            </>
          )}
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel title={t("license")}>
            <DetailList
              items={[
                {
                  label: t("licenseNumber"),
                  value: doctor.licenseNumber ? (
                    <span dir="ltr">{doctor.licenseNumber}</span>
                  ) : (
                    tc("none")
                  ),
                },
                {
                  label: t("status"),
                  value: tv(`status.${doctor.status ?? "none"}`),
                },
                ...(doctor.submittedAt
                  ? [
                      {
                        label: tv("step2"),
                        value: format.dateTime(doctor.submittedAt),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>
          <Panel title={t("clinic")}>
            <DetailList
              items={[
                {
                  label: t("clinic"),
                  value: [doctor.clinicName, doctor.clinicAddress]
                    .filter(Boolean)
                    .join(" · "),
                },
                {
                  label: t("specialty"),
                  value: doctor.specialty ?? tc("none"),
                },
                {
                  label: t("experience"),
                  value:
                    doctor.yearsOfExperience === null
                      ? tc("none")
                      : tc("years", { count: doctor.yearsOfExperience }),
                },
              ]}
            />
          </Panel>
          <Panel title={t("account")} bodyClassName="gap-4">
            <DetailList
              items={[
                {
                  label: t("email"),
                  value: <span dir="ltr">{doctor.email}</span>,
                },
                {
                  label: t("phone"),
                  value: doctor.phone ? (
                    <span dir="ltr">{doctor.phone}</span>
                  ) : (
                    tc("none")
                  ),
                },
                { label: t("city"), value: doctor.city },
                {
                  label: t("emailVerified"),
                  value: doctor.emailVerified ? t("yes") : t("no"),
                },
              ]}
            />
            <Button
              variant="outline"
              onClick={() => setDialog("status")}
              className={cn(
                "h-10 self-start rounded-none px-4",
                doctor.isActive && "text-danger hover:text-danger"
              )}
            >
              {doctor.isActive ? t("deactivate") : t("activate")}
            </Button>
          </Panel>
        </div>
      </div>
      <Decisions
        doctor={doctor}
        dialog={dialog}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
