"use client"

/**
 * Patient record page: header (MRN, age, gender, city), latest result, and tabs for
 * analysis history, reports, visits and notes. Actions: message, new analysis,
 * edit profile, unassign.
 */

import {
  FileTextIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  ScanEyeIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { DetailList, Panel } from "@/components/page/panel"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadBlob } from "@/lib/format"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { ageFrom, useAnalysisLabels, useFormat } from "@/lib/i18n/use-labels"
import { useListAnalysesQuery } from "@/services/analysis.service"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"
import { useStartConversationMutation } from "@/services/chat.service"
import { useUnassignPatientMutation } from "@/services/doctor.service"
import { useGetPatientQuery } from "@/services/patient.service"
import {
  useDownloadReportMutation,
  useListReportsQuery,
} from "@/services/report.service"

import { EditPatientDialog } from "./edit-patient-dialog"
import { VisitList } from "./visit-list"

type Tab = "history" | "reports" | "appointments" | "notes"

export function PatientDetail({ id }: { id: string }) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const router = useRouter()
  const errorText = useErrorText()
  const format = useFormat()
  const labels = useAnalysisLabels()
  const [tab, setTab] = useState<Tab>("history")
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { data: patient, isLoading, isError, refetch } = useGetPatientQuery(id)
  const { data: analyses } = useListAnalysesQuery(
    { patientId: id, size: 50 },
    { skip: !patient }
  )
  const { data: reports } = useListReportsQuery(
    { patientId: id, size: 50 },
    { skip: !patient }
  )
  // No per-patient appointment endpoint: load the doctor's appointments and filter below.
  const { data: appointments } = useListMyAppointmentsQuery(
    { size: 100 },
    { skip: !patient }
  )
  const [startConversation, { isLoading: starting }] =
    useStartConversationMutation()
  const [unassign, { isLoading: unassigning }] = useUnassignPatientMutation()
  const [download] = useDownloadReportMutation()

  if (isLoading) return <Skeleton className="h-64 w-full rounded-none" />
  if (isError || !patient)
    return <ErrorState message={t("detail.notFound")} onRetry={refetch} />

  const age = ageFrom(patient.dateOfBirth)
  const latest = analyses?.docs.find((item) => item.status === "completed")
  const visits =
    appointments?.docs.filter(
      (item) => item.patient?._id === patient.user._id
    ) ?? []
  const meta = [
    <span key="mrn" dir="ltr">
      {patient.medicalRecordNumber}
    </span>,
    age !== null ? tc("yearsOld", { count: age }) : null,
    patient.gender ? tc(`gender.${patient.gender}`) : null,
    patient.user.city,
  ].filter(Boolean)

  const message = async () => {
    try {
      const conversation = await startConversation({
        participantId: patient.user._id,
      }).unwrap()
      router.push(`/doctor/messages?c=${conversation._id}`)
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar
            name={patient.user.name}
            src={patient.user.avatarUrl}
            className="size-14 text-base"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">
                {patient.user.name}
              </h1>
              {latest && (
                <StatusChip tone={labels.stage1(latest).tone}>
                  {labels.stage1(latest).label}
                </StatusChip>
              )}
            </div>
            <p className="flex flex-wrap gap-x-1.5 text-sm text-subtle">
              {meta.map((item, index) => (
                <span key={index}>
                  {index > 0 && "· "}
                  {item}
                </span>
              ))}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={starting}
            onClick={() => void message()}
            className="h-10 gap-2 rounded-none px-4"
          >
            <MessageSquareIcon className="size-4" aria-hidden="true" />
            {t("message")}
          </Button>
          <Link
            href={`/doctor/analyses/new?patient=${patient._id}`}
            className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ScanEyeIcon className="size-4" aria-hidden="true" />
            {t("newAnalysis")}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("moreActions", { name: patient.user.name })}
              className="inline-flex size-10 items-center justify-center border border-border hover:bg-muted"
            >
              <MoreHorizontalIcon className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 rounded-none">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                {t("form.editTitle")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirming(true)}
              >
                {t("unassign")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <TabBar
            label={t("detail.tabs")}
            value={tab}
            onChange={setTab}
            items={[
              {
                value: "history",
                label: t("detail.history"),
                count: analyses?.count,
              },
              {
                value: "reports",
                label: t("detail.reports"),
                count: reports?.count,
              },
              {
                value: "appointments",
                label: t("detail.appointments"),
                count: visits.length,
              },
              { value: "notes", label: t("detail.notes") },
            ]}
          />
          {tab === "history" &&
            (!analyses ? (
              <ListSkeleton />
            ) : analyses.docs.length === 0 ? (
              <EmptyState
                icon={ScanEyeIcon}
                title={t("detail.noAnalyses")}
                description={t("detail.noAnalysesHint")}
              />
            ) : (
              <ol className="flex flex-col border border-b-0 border-border">
                {analyses.docs.map((analysis) => {
                  const stage1 = labels.stage1(analysis)
                  const review = labels.review(analysis)
                  return (
                    <li
                      key={analysis._id}
                      className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3.5"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-semibold">
                          {format.date(
                            analysis.image?.capturedAt ?? analysis.createdAt
                          )}{" "}
                          · {labels.eye(analysis.image?.eye)}
                        </span>
                        <span className="text-xs text-subtle">
                          {[stage1.label, stage1.detail]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {review && (
                        <StatusChip tone={review.tone}>
                          {review.label}
                        </StatusChip>
                      )}
                      <Link
                        href={`/doctor/analyses/${analysis._id}`}
                        className="text-[13px] font-semibold text-brand hover:text-brand-strong"
                      >
                        {tc("open")}
                      </Link>
                    </li>
                  )
                })}
              </ol>
            ))}
          {tab === "reports" &&
            (!reports ? (
              <ListSkeleton />
            ) : reports.docs.length === 0 ? (
              <EmptyState icon={FileTextIcon} title={t("detail.noReports")} />
            ) : (
              <ul className="flex flex-col border border-b-0 border-border">
                {reports.docs.map((report) => (
                  <li
                    key={report._id}
                    className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3.5"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-semibold">
                        {report.title}
                      </span>
                      <span className="text-xs text-subtle">
                        {format.date(report.createdAt)}
                      </span>
                    </span>
                    <StatusChip
                      tone={report.status === "sent" ? "success" : "warning"}
                    >
                      {tc(`reportStatus.${report.status}`)}
                    </StatusChip>
                    {report.hasPdf && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            downloadBlob(
                              await download(report._id).unwrap(),
                              `${report.title}.pdf`
                            )
                          } catch (caught) {
                            toast.error(errorText(caught))
                          }
                        }}
                        className="text-[13px] font-semibold text-brand hover:text-brand-strong"
                      >
                        {tc("download")}
                      </button>
                    )}
                    <Link
                      href={`/doctor/reports/${report._id}`}
                      className="text-[13px] font-semibold text-brand hover:text-brand-strong"
                    >
                      {tc("open")}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          {tab === "appointments" && <VisitList visits={visits} />}
          {tab === "notes" && (
            <Panel
              title={t("detail.medicalNotes")}
              action={<EditButton onClick={() => setEditing(true)} />}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {patient.medicalNotes || t("detail.noNotes")}
              </p>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel
            id="profile"
            title={t("detail.profile")}
            action={<EditButton onClick={() => setEditing(true)} />}
          >
            <DetailList
              items={[
                {
                  label: t("detail.record"),
                  value: <span dir="ltr">{patient.medicalRecordNumber}</span>,
                },
                {
                  label: t("detail.dob"),
                  value: patient.dateOfBirth
                    ? `${format.date(patient.dateOfBirth)}${age !== null ? ` · ${tc("yearsOld", { count: age })}` : ""}`
                    : tc("none"),
                },
                {
                  label: t("detail.gender"),
                  value: patient.gender
                    ? tc(`gender.${patient.gender}`)
                    : tc("none"),
                },
                {
                  label: t("detail.since"),
                  value: patient.diabetesSince
                    ? t("detail.sinceValue", {
                        year: patient.diabetesSince,
                        count: new Date().getFullYear() - patient.diabetesSince,
                      })
                    : tc("none"),
                },
                {
                  label: t("detail.email"),
                  value: <span dir="ltr">{patient.user.email}</span>,
                },
                {
                  label: t("detail.phone"),
                  value: patient.user.phone ? (
                    <span dir="ltr">{patient.user.phone}</span>
                  ) : (
                    tc("none")
                  ),
                },
                { label: t("detail.city"), value: patient.user.city },
                {
                  label: t("detail.emergency"),
                  value: patient.emergencyContact || tc("none"),
                },
                {
                  label: t("detail.assignedSince"),
                  value: format.date(patient.createdAt),
                },
              ]}
            />
          </Panel>
          <Panel title={t("detail.visits")}>
            <VisitList visits={visits.slice(0, 3)} compact />
          </Panel>
          <Panel title={t("detail.medicalNotes")}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {patient.medicalNotes || t("detail.noNotes")}
            </p>
          </Panel>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="self-start text-sm font-semibold text-danger hover:underline"
          >
            {t("unassign")}
          </button>
        </div>
      </div>

      {editing && (
        <EditPatientDialog
          patient={patient}
          onClose={() => setEditing(false)}
        />
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("detail.unassignTitle", { name: patient.user.name })}
        description={t("detail.unassignBody")}
        confirmLabel={t("unassign")}
        destructive
        pending={unassigning}
        onConfirm={async () => {
          try {
            await unassign(patient._id).unwrap()
            toast.success(t("detail.unassigned"))
            router.replace("/doctor/patients")
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      />
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  const tc = useTranslations("common")
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-semibold text-brand hover:text-brand-strong"
    >
      {tc("edit")}
    </button>
  )
}
