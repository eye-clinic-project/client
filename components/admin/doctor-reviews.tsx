"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Building2, Check, Mail, MapPin, Search, X } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Alert, Avatar, Button, Card, EmptyState, Field, Input, PageTitle, Spinner, StatusChip, Textarea } from "@/components/rc/ui"
import { useAdminCounts } from "@/components/shell/admin-shell"
import { useApi, useCooldown } from "@/hooks/use-api"
import type { AdminDoctor, DoctorVerificationStatus } from "@/lib/api-types"
import { fmtDate, fmtRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { adminService } from "@/service/admin.service"
import { errorMessage } from "@/service/api-client"

type Tab = DoctorVerificationStatus | "all"
const TABS: Tab[] = ["pending", "approved", "rejected", "all"]
const PAGE_SIZE = 12

export function DoctorReviews() {
  const { t } = useI18n()
  const a = t.admin
  const router = useRouter()
  const params = useSearchParams()
  const { pendingDoctors, reloadCounts } = useAdminCounts()

  const tab = (TABS as string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "pending"
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<AdminDoctor | null>(null)

  // Search after the admin stops typing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const list = useApi(
    () => adminService.doctors({ status: tab === "all" ? undefined : tab, search: query || undefined, page, size: PAGE_SIZE }),
    [tab, query, page],
  )

  function selectTab(next: Tab) {
    setPage(1)
    setNotice(null)
    router.replace(next === "pending" ? "/admin/doctors" : `/admin/doctors?tab=${next}`)
  }

  async function afterReview(message: string) {
    setNotice(message)
    await Promise.all([list.reload(), reloadCounts()])
  }

  return (
    <>
      <PageTitle eyebrow={a.eyebrow}>{a.doctorsTitle}</PageTitle>
      <p className="-mt-4 max-w-2xl text-[15px] text-muted-foreground">{a.doctorsSubtitle}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label={a.doctorsTitle} className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-subtle-foreground hover:bg-muted",
              )}
            >
              {a.tabs[key]}
              {key === "pending" && pendingDoctors > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px]",
                    tab === key ? "bg-white/20" : "bg-[#C2410C] text-white",
                  )}
                >
                  {pendingDoctors}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-80">
          <span className="sr-only">{a.searchDoctors}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={a.searchDoctors} className="h-11 ps-9" />
        </label>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {list.error ? <Alert>{errorMessage(list.error)}</Alert> : null}
      {list.loading && !list.data && <Spinner />}

      {list.data && !list.data.items.length && (
        <Card>
          <EmptyState title={tab === "pending" && !query ? a.emptyPending : a.empty} />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {list.data?.items.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onApproved={() => afterReview(a.approvedMsg(doctor.name))}
            onReject={() => setRejecting(doctor)}
          />
        ))}
      </div>

      {list.data && list.data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t.common.previous}
          </Button>
          <span className="text-sm text-muted-foreground">{a.pageOf(page, list.data.pages)}</span>
          <Button variant="outline" size="sm" disabled={page >= list.data.pages} onClick={() => setPage(page + 1)}>
            {t.common.next}
          </Button>
        </div>
      )}

      {rejecting && (
        <RejectDialog
          doctor={rejecting}
          onClose={() => setRejecting(null)}
          onDone={async () => {
            const name = rejecting.name
            setRejecting(null)
            await afterReview(a.rejectedMsg(name))
          }}
        />
      )}
    </>
  )
}

function DoctorCard({ doctor, onApproved, onReject }: { doctor: AdminDoctor; onApproved: () => void; onReject: () => void }) {
  const { t } = useI18n()
  const a = t.admin
  const profile = doctor.profile
  const status = profile?.verificationStatus ?? "pending"
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cooldown = useCooldown()

  async function approve() {
    setBusy(true)
    setError(null)
    try {
      await adminService.approveDoctor(doctor.id)
      onApproved()
    } catch (err) {
      cooldown.trip(err)
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <Avatar name={doctor.name} src={doctor.avatarUrl} size={46} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-semibold">{doctor.name}</span>
          <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            {doctor.email}
          </span>
        </div>
        <StatusChip status={status} />
      </div>

      <div className="rounded-xl border border-dashed bg-background/60 px-4 py-3">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{a.license}</p>
        <p dir="ltr" className={cn("font-mono text-lg font-semibold tracking-wide rtl:text-end", !profile?.licenseNumber && "text-muted-foreground")}>
          {profile?.licenseNumber ?? a.noLicense}
        </p>
      </div>

      <dl className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">{a.clinic}</dt>
          <dd className="truncate">
            {profile?.clinicName ?? t.common.dash}
            {profile?.specialty && <span className="text-muted-foreground"> · {profile.specialty}</span>}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <dd className="truncate text-muted-foreground">
            {[profile?.clinicAddress, doctor.city].filter(Boolean).join(" · ") || t.common.dash}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>
            {a.submitted}: {fmtDate(profile?.verificationSubmittedAt ?? profile?.createdAt ?? doctor.createdAt ?? null)}
          </span>
          {status !== "pending" && profile?.verifiedAt && <span>{fmtRelative(profile.verifiedAt)}</span>}
        </div>
      </dl>

      {status === "rejected" && profile?.rejectionReason && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-fg">
          <strong>{a.previousReason}:</strong> {profile.rejectionReason}
        </p>
      )}

      {error && <Alert>{error}</Alert>}

      <div className="mt-auto flex gap-2 border-t pt-4">
        {status !== "approved" && (
          <Button size="sm" className="flex-1" loading={busy} disabled={!profile?.licenseNumber || cooldown.active} onClick={() => void approve()}>
            {!busy && <Check className="size-4" aria-hidden="true" />}
            {a.approve}
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          className="flex-1"
          disabled={busy || !profile?.licenseNumber || cooldown.active}
          onClick={onReject}
        >
          <X className="size-4" aria-hidden="true" />
          {a.reject}
        </Button>
      </div>
    </Card>
  )
}

function RejectDialog({ doctor, onClose, onDone }: { doctor: AdminDoctor; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n()
  const a = t.admin
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cooldown = useCooldown()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    // No close() in cleanup: under StrictMode it would fire onClose and unmount the dialog at once.
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError(a.reasonRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await adminService.rejectDoctor(doctor.id, reason.trim())
      onDone()
    } catch (err) {
      cooldown.trip(err)
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold">{a.rejectTitle(doctor.name)}</h2>
          <p dir="ltr" className="font-mono text-sm text-muted-foreground rtl:text-end">
            {doctor.profile?.licenseNumber}
          </p>
        </div>
        <Field label={a.reasonLabel} error={error ?? undefined}>
          {(f) => (
            <Textarea
              {...f}
              autoFocus
              rows={4}
              maxLength={500}
              placeholder={a.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="danger" loading={busy} disabled={cooldown.active}>
            {a.confirmReject}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
