"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { UserAvatar } from "@/components/common/user-avatar"
import { SearchInput } from "@/components/page/search-input"
import { useDebounced } from "@/hooks/use-debounced"
import { ageFrom } from "@/lib/i18n/use-labels"
import {
  useGetPatientQuery,
  useListPatientsQuery,
} from "@/services/patient.service"

/** Patient search + selection. Shows the chosen patient's card once selected. */
export function PatientPicker({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (id: string) => void
  invalid: boolean
}) {
  const t = useTranslations("analyses.create")
  const tc = useTranslations("common")
  const [search, setSearch] = useState("")
  const debounced = useDebounced(search.trim())
  const { data: selected } = useGetPatientQuery(value, { skip: !value })
  const { data, isFetching } = useListPatientsQuery(
    { search: debounced || undefined, size: 8 },
    { skip: Boolean(value) }
  )

  if (value && selected) {
    const age = ageFrom(selected.dateOfBirth)
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("patient")}</span>
        <div className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5">
          <UserAvatar name={selected.user.name} src={selected.user.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{selected.user.name}</span>
            <span className="truncate text-xs text-subtle">
              <span dir="ltr">{selected.medicalRecordNumber}</span>
              {age !== null && ` · ${tc("yearsOld", { count: age })}`}
              {selected.gender && ` · ${tc(`gender.${selected.gender}`)}`}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[13px] font-semibold text-brand hover:text-brand-strong"
          >
            {t("change")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t("patient")}</span>
      <SearchInput
        label={t("patientSearch")}
        placeholder={t("patientSearch")}
        value={search}
        onChange={setSearch}
        className={invalid ? "border-destructive" : undefined}
      />
      <ul
        className="flex max-h-64 flex-col overflow-y-auto border border-b-0 border-border"
        aria-busy={isFetching}
      >
        {data?.docs.length === 0 && (
          <li className="border-b border-border px-3 py-3 text-sm text-subtle">
            {t("noPatients")}
          </li>
        )}
        {data?.docs.map((patient) => (
          <li key={patient._id} className="border-b border-border">
            <button
              type="button"
              onClick={() => onChange(patient._id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted"
            >
              <UserAvatar
                name={patient.user.name}
                src={patient.user.avatarUrl}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">
                  {patient.user.name}
                </span>
                <span className="text-xs text-subtle" dir="ltr">
                  {patient.medicalRecordNumber}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">{t("patientHint")}</p>
    </div>
  )
}
