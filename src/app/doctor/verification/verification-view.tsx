"use client"

/**
 * License verification page: 3-step progress (account → submit license → admin review),
 * the current submission, and the license form when there's nothing submitted,
 * it was rejected, or the doctor chooses to resubmit.
 */

import { CheckIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useGetMyClinicQuery,
  useGetMyVerificationQuery,
} from "@/services/doctor.service"

import { LicenseForm } from "./license-form"
import { SubmissionSummary } from "./submission-summary"

type StepState = "done" | "current" | "todo" | "failed"

export function VerificationView() {
  const t = useTranslations("verification")
  const format = useFormat()
  const {
    data: verification,
    isLoading,
    isError,
    refetch,
  } = useGetMyVerificationQuery()
  const { data: clinic } = useGetMyClinicQuery()
  const [editing, setEditing] = useState(false)

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !verification) return <ErrorState onRetry={refetch} />

  const submitted = Boolean(verification.submittedAt)
  const status = verification.status
  // Show the form when nothing is submitted, after a rejection, or when editing.
  const showForm = editing || !submitted || status === "rejected"
  const steps: { title: string; detail: string; state: StepState }[] = [
    { title: t("step1"), detail: t("step1Detail"), state: "done" },
    {
      title: t("step2"),
      detail:
        submitted && verification.submittedAt
          ? t("step2Detail", { date: format.date(verification.submittedAt) })
          : t("step2Todo"),
      state: submitted && status !== "rejected" ? "done" : "current",
    },
    {
      title: t("step3"),
      detail:
        status === "rejected"
          ? t("step3Rejected", {
              date: format.date(
                verification.verifiedAt ??
                  verification.submittedAt ??
                  new Date()
              ),
            })
          : status === "approved"
            ? format.date(verification.verifiedAt ?? new Date())
            : submitted
              ? t("step3Pending")
              : t("step3Todo"),
      state:
        status === "approved"
          ? "done"
          : status === "rejected"
            ? "failed"
            : submitted
              ? "current"
              : "todo",
    },
    {
      title: t("step4"),
      detail: t("step4Detail"),
      state: status === "approved" ? "done" : "todo",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <ol
        aria-label={t("steps")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 border-t-[3px] bg-card p-4",
              step.state === "done"
                ? "border-success"
                : step.state === "current"
                  ? "border-brand"
                  : step.state === "failed"
                    ? "border-danger"
                    : "border-border"
            )}
          >
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.state === "done"
                  ? "bg-success text-white"
                  : step.state === "current"
                    ? "bg-brand text-white"
                    : step.state === "failed"
                      ? "bg-danger text-white"
                      : "bg-muted text-subtle"
              )}
              aria-hidden="true"
            >
              {step.state === "done" ? (
                <CheckIcon className="size-4" />
              ) : (
                index + 1
              )}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="text-xs text-subtle">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel id="license" title={t("details")}>
          {showForm ? (
            <LicenseForm
              verification={verification}
              onDone={() => setEditing(false)}
              canCancel={editing}
            />
          ) : (
            <SubmissionSummary
              verification={verification}
              onReplace={() => setEditing(true)}
            />
          )}
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title={t("untilTitle")}>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-sm leading-relaxed text-muted-foreground">
              <li>{t("until1")}</li>
              <li>{t("until2")}</li>
              <li>{t("until3")}</li>
            </ul>
          </Panel>
          {clinic && (
            <Panel
              title={t("clinic")}
              action={
                <Link
                  href="/doctor/settings#clinic"
                  className="text-[13px] font-semibold text-brand hover:text-brand-strong"
                >
                  {t("editClinic")}
                </Link>
              }
            >
              <p className="text-sm font-semibold">{clinic.clinicName}</p>
              <p className="text-sm text-muted-foreground">
                {[clinic.clinicAddress, clinic.specialty]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
