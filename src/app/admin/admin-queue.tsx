"use client"

import { ShieldCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { PageHeader } from "@/components/page/page-header"
import { Pagination } from "@/components/page/pagination"
import { SearchInput } from "@/components/page/search-input"
import { EmptyState, ErrorState, ListSkeleton } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { verificationTone } from "@/components/settings/license-section"
import { StatusChip } from "@/components/status-chip"
import { UserAvatar } from "@/components/user-avatar"
import { useDebounced } from "@/hooks/use-debounced"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useListAdminDoctorsQuery,
  type AdminDoctorListParams,
} from "@/service/admin.service"
import { DoctorReview } from "./doctor-review"

const QUEUES = {
  waiting: { status: "pending", submitted: true },
  notSubmitted: { submitted: false },
  approved: { status: "approved" },
  rejected: { status: "rejected" },
  all: {},
} satisfies Record<string, AdminDoctorListParams>

type Queue = keyof typeof QUEUES
const SIZE = 20

export function AdminQueue({ initialId }: { initialId: string | null }) {
  const t = useTranslations("admin")
  const tv = useTranslations("verification")
  const format = useFormat()
  const [queue, setQueue] = useState<Queue>("waiting")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(initialId)
  const term = useDebounced(search.trim(), 300)
  const { data, isLoading, isError, refetch } = useListAdminDoctorsQuery({
    ...QUEUES[queue],
    search: term.length >= 2 ? term : undefined,
    page,
    size: SIZE,
  })
  const { data: waiting } = useListAdminDoctorsQuery({
    ...QUEUES.waiting,
    size: 1,
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      <TabBar
        label={t("views")}
        value={queue}
        onChange={(value) => {
          setQueue(value)
          setPage(1)
        }}
        items={(Object.keys(QUEUES) as Queue[]).map((value) => ({
          value,
          label: t(value),
          count: value === "waiting" ? waiting?.count || undefined : undefined,
        }))}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div
          className={cn(
            "flex min-w-0 flex-col gap-4",
            selected && "max-xl:hidden"
          )}
        >
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : !data || data.docs.length === 0 ? (
            <EmptyState
              icon={ShieldCheckIcon}
              title={t("empty")}
              description={t("emptyHint")}
            />
          ) : (
            <ul className="flex flex-col border border-b-0 border-border">
              {data.docs.map((doctor) => (
                <li key={doctor._id}>
                  <button
                    type="button"
                    aria-current={selected === doctor._id || undefined}
                    onClick={() => setSelected(doctor._id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-start",
                      selected === doctor._id
                        ? "bg-brand-soft"
                        : "bg-card hover:bg-muted"
                    )}
                  >
                    <UserAvatar
                      name={doctor.name}
                      src={doctor.avatarUrl}
                      className="size-10"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">
                        {doctor.name}
                      </span>
                      <span className="truncate text-xs text-subtle">
                        {doctor.clinicName} ·{" "}
                        {doctor.submittedAt
                          ? t("submitted", {
                              date: format.date(doctor.submittedAt),
                            })
                          : t("joined", {
                              date: format.date(doctor.createdAt),
                            })}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusChip tone={verificationTone(doctor.status)}>
                        {tv(`status.${doctor.status ?? "none"}`)}
                      </StatusChip>
                      {!doctor.isActive && (
                        <span className="text-xs font-semibold text-danger">
                          {t("inactive")}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && data.pages > 1 && (
            <Pagination
              page={page}
              size={SIZE}
              total={data.count}
              pages={data.pages}
              onChange={setPage}
            />
          )}
        </div>
        <div className={cn("min-w-0", !selected && "max-xl:hidden")}>
          {selected ? (
            <DoctorReview
              key={selected}
              id={selected}
              onBack={() => setSelected(null)}
            />
          ) : (
            <p className="flex min-h-64 items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("select")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
