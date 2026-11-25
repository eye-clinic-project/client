"use client"

import {
  MessageSquareIcon,
  MoreHorizontalIcon,
  ScanEyeIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { ageFrom, useAnalysisLabels } from "@/lib/i18n/use-labels"
import { useStartConversationMutation } from "@/services/chat.service"
import type { Analysis, Patient } from "@/types/api"

/** Name, latest result, MRN · age · gender · city, and the page actions. */
export function PatientHeader({
  patient,
  latest,
  onEdit,
  onUnassign,
}: {
  patient: Patient
  /** Latest completed analysis, shown as a status chip next to the name. */
  latest?: Analysis
  onEdit: () => void
  onUnassign: () => void
}) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const router = useRouter()
  const errorText = useErrorText()
  const labels = useAnalysisLabels()
  const [startConversation, { isLoading: starting }] =
    useStartConversationMutation()

  const age = ageFrom(patient.dateOfBirth)
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
            <DropdownMenuItem onClick={onEdit}>
              {t("form.editTitle")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onUnassign}>
              {t("unassign")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
