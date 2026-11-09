"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Search } from "lucide-react"

import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  GradeChip,
  Input,
  PageTitle,
  RateLimitNotice,
  Select,
  Spinner,
  controlClass,
} from "@/components/rc/ui"
import { useApi, useCooldown } from "@/hooks/use-api"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { assignmentService, patientService } from "@/service/patient.service"
import type { DiabetesType, Gender, PatientListItem } from "@/lib/api-types"
import { ageFrom, DIABETES_LABELS, fmtDate, fmtRelative, userOf } from "@/lib/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 8
type GradeFilter = "all" | "referable" | "nodr" | "none"

function matchesGrade(p: PatientListItem, filter: GradeFilter) {
  const level = p.latestAnalysis?.predictedLevel
  if (filter === "all") return true
  if (filter === "none") return level === undefined
  if (filter === "nodr") return level === 0
  return level !== undefined && level >= 2
}

export function PatientsPage() {
  const params = useSearchParams()
  const router = useRouter()
  const tab = params.get("tab") === "requests" ? "requests" : "assigned"
  const [search, setSearch] = useState("")
  const [term, setTerm] = useState("")
  const [page, setPage] = useState(1)
  const [grade, setGrade] = useState<GradeFilter>("all")

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTerm(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [search])

  const list = useApi(
    () => patientService.search({ search: term || undefined, page, size: PAGE_SIZE }),
    [term, page],
  )
  const requests = useApi(() => assignmentService.list({ status: "pending", size: 50 }), [])
  const requestCount = requests.data?.total ?? 0
  const rows = (list.data?.items ?? []).filter((p) => matchesGrade(p, grade))
  const from = list.data ? (list.data.page - 1) * list.data.size + 1 : 0
  const to = list.data ? from + list.data.items.length - 1 : 0

  const setTab = (next: string) => router.replace(next === "requests" ? "/doctor/patients?tab=requests" : "/doctor/patients")

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <PageTitle>Patients</PageTitle>
          <div role="tablist" aria-label="Patient lists" className="flex gap-1 rounded-xl bg-muted p-1">
            {[
              ["assigned", `Assigned · ${list.data?.total ?? "…"}`],
              ["requests", `Requests · ${requestCount}`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "h-10 rounded-[9px] px-4 text-sm font-semibold",
                  tab === key ? "bg-card text-foreground shadow-sm" : "text-subtle-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {tab === "assigned" ? (
          <>
            <div className="flex flex-wrap gap-3">
              <label htmlFor="patient-search" className="sr-only">
                Search patients
              </label>
              <div className="relative min-w-[240px] flex-[1_1_320px]">
                <Search className="absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="patient-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or patient ID (P-XXXXXX)"
                  className={cn(controlClass, "pl-10")}
                />
              </div>
              <label htmlFor="grade-filter" className="sr-only">
                Filter by grade
              </label>
              <Select
                id="grade-filter"
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeFilter)}
                className="w-auto min-w-[200px]"
              >
                <option value="all">All grades</option>
                <option value="referable">Referable (Moderate+)</option>
                <option value="nodr">No DR</option>
                <option value="none">No scan yet</option>
              </Select>
            </div>

            <Card className="overflow-hidden">
              {list.error ? <Alert className="m-4">{errorMessage(list.error)}</Alert> : null}
              {list.loading && !list.data ? (
                <Spinner />
              ) : rows.length === 0 ? (
                <EmptyState title={term ? "No patients found" : "No patients yet"}>
                  {term ? "Try a name, email or patient ID." : "Add a patient to start screening."}
                </EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[13px] whitespace-nowrap text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Patient</th>
                        <th className="px-2 py-3 font-semibold">Patient ID</th>
                        <th className="px-2 py-3 font-semibold">Age · sex</th>
                        <th className="px-2 py-3 font-semibold">Diabetes</th>
                        <th className="px-2 py-3 font-semibold">Latest grade</th>
                        <th className="px-2 py-3 font-semibold">Last scan</th>
                        <th className="px-5 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const age = ageFrom(p.profile?.dateOfBirth)
                        const sex = p.profile?.gender === "male" ? "M" : p.profile?.gender === "female" ? "F" : null
                        const dm = p.profile?.diabetesType
                        return (
                          <tr key={p.id} className="border-t border-muted">
                            <td className="px-5 py-3">
                              <span className="flex items-center gap-3">
                                <Avatar name={p.name} src={p.avatarUrl} size={36} />
                                <span className="flex min-w-0 flex-col">
                                  <span className="font-semibold">{p.name}</span>
                                  <span className="truncate text-[13px] text-muted-foreground">{p.email}</span>
                                </span>
                              </span>
                            </td>
                            <td className="px-2 py-3 font-mono text-[13px] whitespace-nowrap text-subtle-foreground">
                              {p.profile?.medicalRecordNumber ?? "—"}
                            </td>
                            <td className="px-2 py-3 text-subtle-foreground">
                              {[age, sex].filter((v) => v !== null).join(" · ") || "—"}
                            </td>
                            <td className="px-2 py-3 text-subtle-foreground">
                              {dm
                                ? `${DIABETES_LABELS[dm]}${p.profile?.diabetesSince ? ` · ${new Date().getFullYear() - p.profile.diabetesSince} y` : ""}`
                                : "—"}
                            </td>
                            <td className="px-2 py-3">
                              <GradeChip level={p.latestAnalysis?.predictedLevel} />
                            </td>
                            <td className="px-2 py-3 text-subtle-foreground">{fmtDate(p.latestAnalysis?.createdAt)}</td>
                            <td className="px-5 py-3 text-right whitespace-nowrap">
                              <Link
                                href={`/doctor/scan?patientId=${p.id}`}
                                className="mr-4 font-semibold text-primary hover:underline"
                              >
                                New scan
                              </Link>
                              {p.latestAnalysis ? (
                                <Link
                                  href={`/doctor/analyses/${p.latestAnalysis.id}`}
                                  className="font-semibold text-primary hover:underline"
                                >
                                  View result
                                </Link>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {list.data && list.data.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
                  <span>
                    Showing {from}–{to} of {list.data.total}
                    {grade !== "all" && " (filtered on this page)"}
                  </span>
                  <span className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= list.data.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </span>
                </div>
              )}
            </Card>
          </>
        ) : (
          <RequestsList
            loading={requests.loading}
            error={requests.error}
            items={requests.data?.items ?? []}
            onChanged={() => {
              void requests.reload()
              void list.reload()
            }}
          />
        )}
      </div>

      <AddPatient focus={params.get("add") === "1"} onAdded={() => void list.reload()} />
    </div>
  )
}

function RequestsList({
  items,
  loading,
  error,
  onChanged,
}: {
  items: { id: string; patient: unknown; assignedAt: string; notes?: string }[]
  loading: boolean
  error: unknown
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function decide(id: string, status: "active" | "ended") {
    setBusy(id)
    setActionError(null)
    try {
      await assignmentService.setStatus(id, status)
      onChanged()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="overflow-hidden">
      {error ? <Alert className="m-4">{errorMessage(error)}</Alert> : null}
      {actionError && <Alert className="m-4">{actionError}</Alert>}
      {loading && !items.length ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No requests">When a patient asks you to follow them, the request appears here.</EmptyState>
      ) : (
        <ul>
          {items.map((r) => {
            const patient = userOf(r.patient as never)
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 border-t px-5 py-4 first:border-t-0">
                <Avatar name={patient?.name ?? "?"} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{patient?.name ?? "Patient"}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {patient?.email} · asked {fmtRelative(r.assignedAt)}
                  </span>
                  {r.notes && <span className="mt-1 text-sm text-subtle-foreground">“{r.notes}”</span>}
                </span>
                <span className="flex gap-2">
                  <Button size="sm" loading={busy === r.id} onClick={() => decide(r.id, "active")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r.id, "ended")}>
                    Decline
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AddPatient({ focus, onAdded }: { focus: boolean; onAdded: () => void }) {
  const cooldown = useCooldown()
  const [mode, setMode] = useState<"new" | "existing">("new")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState<Gender | "">("")
  const [city, setCity] = useState("")
  const [diabetes, setDiabetes] = useState<DiabetesType | "">("type2")
  const [invite, setInvite] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focus) first.current?.focus()
  }, [focus])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    const found: Record<string, string> = {}
    if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address."
    if (mode === "new") {
      if (!name.trim()) found.name = "Full name is required."
      if (!city.trim()) found.city = "City is required."
    }
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      if (mode === "new") {
        await patientService.create({
          name: name.trim(),
          email: email.trim(),
          city: city.trim(),
          dateOfBirth: dob || undefined,
          gender: gender || undefined,
          diabetesType: diabetes || undefined,
          sendInvitation: invite,
        })
        setDone(`${name.trim()} was added${invite ? " and emailed a link to set a password" : ""}.`)
      } else {
        await assignmentService.create({ patientEmail: email.trim() })
        setDone(`The patient with ${email.trim()} is now assigned to you.`)
      }
      setName("")
      setEmail("")
      setDob("")
      setGender("")
      setCity("")
      onAdded()
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside aria-label="Add patient" className="flex-[1_1_320px] lg:sticky lg:top-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Add a patient</h2>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["new", "New patient"],
              ["existing", "Existing (by email)"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={cn(
                "h-10 rounded-[9px] text-sm font-semibold",
                mode === key ? "bg-card shadow-sm" : "text-subtle-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}
        {done && <Alert tone="success">{done}</Alert>}
        <RateLimitNotice remaining={cooldown.remaining} />

        {mode === "new" && (
          <Field label="Full name" error={errors.name}>
            {(p) => <Input {...p} ref={first} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
        )}
        <Field label="Email" error={errors.email}>
          {(p) => (
            <Input
              {...p}
              ref={mode === "existing" ? first : undefined}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        {mode === "new" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                {(p) => <Input {...p} type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />}
              </Field>
              <Field label="Sex">
                {(p) => (
                  <Select {...p} value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}>
                    <option value="">—</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </Select>
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.city}>
                {(p) => <Input {...p} value={city} onChange={(e) => setCity(e.target.value)} />}
              </Field>
              <Field label="Diabetes">
                {(p) => (
                  <Select {...p} value={diabetes} onChange={(e) => setDiabetes(e.target.value as DiabetesType | "")}>
                    <option value="type2">Type 2</option>
                    <option value="type1">Type 1</option>
                    <option value="gestational">Gestational</option>
                    <option value="other">Other</option>
                    <option value="">Not known</option>
                  </Select>
                )}
              </Field>
            </div>
            <Checkbox checked={invite} onChange={(e) => setInvite(e.target.checked)}>
              Email the patient a link to set their password
            </Checkbox>
          </>
        )}
        <Button type="submit" loading={busy} disabled={cooldown.active}>
          {mode === "new" ? "Create and assign" : "Assign to me"}
        </Button>
        <p className="text-[13px] leading-snug text-muted-foreground">
          Only you, and other doctors the patient is assigned to, can see this record.
        </p>
      </form>
    </aside>
  )
}
