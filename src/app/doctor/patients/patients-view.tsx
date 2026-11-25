"use client"

import { PlusIcon, ScanEyeIcon, UsersIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { SearchInput } from "@/components/page/search-input"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useDebounced } from "@/hooks/use-debounced"
import { ageFrom, useFormat } from "@/lib/i18n/use-labels"
import { useListPatientsQuery } from "@/service/patient.service"
import { AddPatientPanel } from "./add-patient-panel"
import { PatientAssignCombobox } from "./patient-assign-combobox"

const PAGE_SIZE = 10

export function PatientsView({
  initialSearch,
  initialAdd,
}: {
  initialSearch: string
  initialAdd: boolean
}) {
  const t = useTranslations("patients")
  const router = useRouter()
  const [view, setView] = useState<"mine" | "find">("mine")
  const [adding, setAdding] = useState(initialAdd)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("lead")}
        actions={
          <Button
            onClick={() => setAdding(true)}
            className="h-10 gap-2 rounded-none px-4 text-sm font-semibold"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            {t("add")}
          </Button>
        }
      />
      <TabBar
        label={t("views")}
        value={view}
        onChange={setView}
        items={[
          { value: "mine", label: t("mine") },
          { value: "find", label: t("find") },
        ]}
      />
      <div
        className={
          adding
            ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
            : "flex flex-col"
        }
      >
        <section className="min-w-0">
          {view === "mine" ? (
            <MyPatients
              initialSearch={initialSearch}
              onAdd={() => setAdding(true)}
            />
          ) : (
            <FindPatients />
          )}
        </section>
        {adding && (
          <AddPatientPanel
            onClose={() => setAdding(false)}
            onCreated={(patient) => {
              setAdding(false)
              router.push(`/doctor/patients/${patient._id}`)
            }}
          />
        )}
      </div>
    </div>
  )
}

function MyPatients({
  initialSearch,
  onAdd,
}: {
  initialSearch: string
  onAdd: () => void
}) {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const format = useFormat()
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search.trim())
  const { data, isLoading, isError, refetch, isFetching } =
    useListPatientsQuery({
      page,
      size: PAGE_SIZE,
      search: debounced || undefined,
    })

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        label={t("searchMine")}
        placeholder={t("searchMinePlaceholder")}
        value={search}
        onChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        className="max-w-md"
      />
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.docs.length === 0 ? (
        debounced ? (
          <EmptyState icon={UsersIcon} title={t("noMatches")} />
        ) : (
          <EmptyState
            icon={UsersIcon}
            title={t("emptyMine")}
            description={t("emptyMineHint")}
            action={
              <Button onClick={onAdd} className="h-10 rounded-none px-4">
                {t("add")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <div
            className="overflow-x-auto border border-border"
            aria-busy={isFetching}
          >
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-surface text-start text-xs font-semibold text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t("columns.patient")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t("columns.age")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t("columns.since")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t("columns.city")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t("columns.added")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.docs.map((patient) => {
                  const age = ageFrom(patient.dateOfBirth)
                  return (
                    <tr
                      key={patient._id}
                      className="border-t border-border hover:bg-surface"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/doctor/patients/${patient._id}`}
                          className="flex items-center gap-3"
                        >
                          <UserAvatar
                            name={patient.user.name}
                            src={patient.user.avatarUrl}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="font-semibold text-foreground">
                              {patient.user.name}
                            </span>
                            <span className="text-xs text-subtle" dir="ltr">
                              {patient.medicalRecordNumber}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[
                          age !== null ? tc("yearsOld", { count: age }) : null,
                          patient.gender
                            ? tc(`gender.${patient.gender}`)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || tc("none")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {patient.diabetesSince ?? tc("none")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {patient.user.city}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format.date(patient.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/doctor/analyses/new?patient=${patient._id}`}
                            className="inline-flex min-h-9 items-center gap-1.5 border border-border px-3 text-[13px] font-semibold hover:bg-muted"
                          >
                            <ScanEyeIcon
                              className="size-4"
                              aria-hidden="true"
                            />
                            {t("newAnalysis")}
                          </Link>
                          <Link
                            href={`/doctor/patients/${patient._id}`}
                            className="inline-flex min-h-9 items-center px-3 text-[13px] font-semibold text-brand hover:text-brand-strong"
                          >
                            {t("openRecord")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.currentPage}
            size={data.size}
            total={data.count}
            pages={data.pages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function FindPatients() {
  return (
    <div className="pt-80">
      <PatientAssignCombobox />
    </div>
  )
}
