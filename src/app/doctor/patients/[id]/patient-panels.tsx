"use client"

import { useTranslations } from "next-intl"

import { DetailList, Panel } from "@/components/page/panel"
import { ageFrom, useFormat } from "@/lib/i18n/use-labels"
import type { Patient } from "@/types/api"

/** Profile details (record number, birth date, contact, diabetes since…). */
export function ProfilePanel({
  patient,
  onEdit,
}: {
  patient: Patient
  onEdit: () => void
}) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const format = useFormat()
  const age = ageFrom(patient.dateOfBirth)

  return (
    <Panel
      id="profile"
      title={t("detail.profile")}
      action={<EditButton onClick={onEdit} />}
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
            value: patient.gender ? tc(`gender.${patient.gender}`) : tc("none"),
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
  )
}

/** The doctor's free-text medical notes. Pass `onEdit` to show an edit link. */
export function MedicalNotesPanel({
  notes,
  onEdit,
}: {
  notes?: string | null
  onEdit?: () => void
}) {
  const t = useTranslations("patients")
  return (
    <Panel
      title={t("detail.medicalNotes")}
      action={onEdit && <EditButton onClick={onEdit} />}
    >
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
        {notes || t("detail.noNotes")}
      </p>
    </Panel>
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
