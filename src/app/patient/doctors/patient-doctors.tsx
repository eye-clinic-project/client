"use client"

/** List of the patient's doctors (clinic, specialty, contact) with shortcuts to book or message. */

import {
  CalendarPlusIcon,
  MessageSquareIcon,
  StethoscopeIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { UserAvatar } from "@/components/common/user-avatar"
import { PageHeader } from "@/components/page/page-header"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { useFormat } from "@/lib/i18n/use-labels"
import { useListMyDoctorsQuery } from "@/services/doctor.service"

export function PatientDoctors() {
  const t = useTranslations("patient.doctors")
  const tc = useTranslations("common")
  const format = useFormat()
  const { data, isLoading, isError, refetch } = useListMyDoctorsQuery()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={StethoscopeIcon}
          title={t("empty")}
          description={t("emptyHint")}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.map((doctor) => (
            <li
              key={doctor._id}
              className="flex flex-col gap-4 border border-border bg-card p-5"
            >
              <div className="flex items-start gap-3.5">
                <UserAvatar
                  name={doctor.name}
                  src={doctor.avatarUrl}
                  className="size-14 text-base"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-base font-semibold">
                    {tc("doctorName", { name: doctor.name })}
                  </span>
                  {doctor.specialty && (
                    <span className="text-sm text-muted-foreground">
                      {doctor.specialty}
                    </span>
                  )}
                  {doctor.yearsOfExperience !== null && (
                    <span className="text-xs text-subtle">
                      {t("experience", { count: doctor.yearsOfExperience })}
                    </span>
                  )}
                </div>
              </div>
              {doctor.bio && (
                <p
                  className="line-clamp-4 text-sm leading-relaxed text-muted-foreground"
                  dir="auto"
                >
                  {doctor.bio}
                </p>
              )}
              <dl className="grid gap-2 border-t border-border pt-4 text-sm">
                {(doctor.clinicName || doctor.clinicAddress) && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-subtle">{t("clinic")}</dt>
                    <dd>
                      {[doctor.clinicName, doctor.clinicAddress]
                        .filter(Boolean)
                        .join(" · ")}
                    </dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-subtle">{t("contact")}</dt>
                  <dd dir="ltr" className="text-start">
                    {[doctor.email, doctor.phone].filter(Boolean).join(" · ")}
                  </dd>
                </div>
                {doctor.assignedAt && (
                  <dd className="text-xs text-subtle">
                    {t("since", { date: format.date(doctor.assignedAt) })}
                  </dd>
                )}
              </dl>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/patient/messages?doctor=${doctor._id}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  <MessageSquareIcon className="size-4" aria-hidden="true" />
                  {tc("message")}
                </Link>
                <Link
                  href={`/patient/book?doctor=${doctor._id}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <CalendarPlusIcon className="size-4" aria-hidden="true" />
                  {tc("bookVisit")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
