"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileImage,
  Plus,
  Search,
  Users,
} from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useProfile } from "@/components/panel/use-profile"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  patientAdded,
  type PatientRecord,
} from "@/lib/redux/features/workspace/workspaceSlice"
import {
  createPatientSchema,
  type CreatePatientValues,
} from "@/lib/validation/patient"

type Patient = PatientRecord

export function DoctorDashboard() {
  const patients = useAppSelector((state) => state.workspace.patients)
  const allAppointments = useAppSelector(
    (state) => state.workspace.appointments
  )
  const appointments = useMemo(
    () => allAppointments.filter((appointment) => appointment.patient !== "Alex Morgan"),
    [allAppointments]
  )
  const screenings = useAppSelector((state) => state.workspace.screenings)
  const reports = useAppSelector((state) => state.workspace.reports)
  const activity = useAppSelector((state) => state.workspace.activity)
  const dispatch = useAppDispatch()
  const profile = useProfile("doctor")
  const awaitingReviewCount = screenings.filter(
    (screening) => screening.status === "Doctor review recommended"
  ).length
  const reportsToSendCount = reports.filter(
    (report) => report.status === "Awaiting doctor review"
  ).length
  const [query, setQuery] = useState("")
  const [addingPatient, setAddingPatient] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePatientValues>({
    resolver: zodResolver(createPatientSchema),
  })

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return patients

    return patients.filter((patient) =>
      [patient.name, patient.patientId, patient.email]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    )
  }, [patients, query])

  function addPatient(values: CreatePatientValues) {
    dispatch(
      patientAdded({
        ...values,
        lastVisit: "Just added",
        status: "Stable",
      })
    )
    reset()
    setAddingPatient(false)
  }

  function handleFileSelection(file?: File) {
    if (!file) {
      setUploadMessage(null)
      return
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setUploadMessage("Choose a JPEG or PNG fundus image.")
      return
    }

    setUploadMessage(
      `${file.name} selected. Image upload and analysis are not connected yet.`
    )
  }

  if (selectedPatient) {
    return (
      <PatientRecord
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    )
  }

  return (
    <div className="space-y-8">
      <section
        id="overview"
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-sm font-medium text-primary">Tuesday, October 20</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good morning, {profile.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here’s an overview of your diabetic retinopathy clinic.
          </p>
        </div>
        <Button className="h-10 gap-2" onClick={() => setAddingPatient(true)}>
          <Plus className="size-4" />
          Add patient
        </Button>
      </section>

      <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        Prototype dashboard with sample data. Patient records and clinical
        actions are not connected to a backend.
      </div>

      <section aria-label="Clinic summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Assigned patients"
          value={patients.length.toString()}
          note="Across your patient list"
          icon={Users}
          trend="up"
        />
        <MetricCard
          label="Awaiting review"
          value={awaitingReviewCount.toString()}
          note="Sample results requiring review"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          label="Appointments today"
          value={appointments.length.toString()}
          note="Next appointment at 10:30"
          icon={CalendarDays}
        />
        <MetricCard
          label="Reports to send"
          value={reportsToSendCount.toString()}
          note="Pending doctor review"
          icon={FileImage}
        />
      </section>

      {addingPatient && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Add a patient</CardTitle>
              <CardDescription className="mt-1">
                This adds a sample patient to this browser session only.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingPatient(false)
                reset()
              }}
            >
              Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              onSubmit={handleSubmit(addPatient)}
              className="space-y-5"
            >
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="patient-name">Full name</FieldLabel>
                  <Input
                    id="patient-name"
                    placeholder="Patient name"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-id">Patient ID</FieldLabel>
                  <Input
                    id="patient-id"
                    placeholder="PT-1050"
                    aria-invalid={!!errors.patientId}
                    {...register("patientId")}
                  />
                  <FieldError>{errors.patientId?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-email">Email</FieldLabel>
                  <Input
                    id="patient-email"
                    type="email"
                    placeholder="patient@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-age">Age</FieldLabel>
                  <Input
                    id="patient-age"
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Age"
                    aria-invalid={!!errors.age}
                    {...register("age")}
                  />
                  <FieldError>{errors.age?.message}</FieldError>
                </Field>
              </FieldGroup>
              <Button type="submit">Add to sample patient list</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section id="patients" className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Patients</CardTitle>
              <CardDescription className="mt-1">
                Search assigned patients by name, ID, or email.
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search patients"
                placeholder="Search patients..."
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">No patients found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different name, ID, or email.
                </p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <PatientListItem
                  key={patient.patientId}
                  patient={patient}
                  onOpen={() => setSelectedPatient(patient)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card id="appointments">
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>Your next scheduled visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {appointments.slice(0, 3).map((appointment) => (
              <Appointment
                key={appointment.id}
                name={appointment.patient}
                reason={appointment.reason}
                time={appointment.time}
                initials={appointment.patient
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              />
            ))}
            <Button variant="outline" className="w-full" asChild>
              <a href="#appointments">View schedule</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="analysis" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload a fundus image</CardTitle>
            <CardDescription>
              JPEG and PNG files are accepted in this prototype.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-5 py-8 text-center transition-colors hover:bg-muted/60">
              <span className="flex size-11 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                <FileImage className="size-5" />
              </span>
              <span className="font-medium">Choose an image to review</span>
              <span className="text-sm text-muted-foreground">
                JPEG or PNG · image processing isn’t connected
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) =>
                  handleFileSelection(event.currentTarget.files?.[0])
                }
              />
            </label>
            {uploadMessage && (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {uploadMessage}
              </p>
            )}
          </CardContent>
        </Card>
        <Card id="messages">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest updates in your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((item) => (
              <ActivityLine
                key={item.id}
                icon={
                  item.type === "screening"
                    ? Check
                    : item.type === "report"
                      ? FileImage
                      : CalendarDays
                }
                title={item.title}
                detail={item.detail}
              />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  note: string
  icon: typeof Users
  trend?: "up" | "down"
}) {
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {trend && <TrendIcon className="size-3.5 text-primary" />}
            {note}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}

function PatientListItem({
  patient,
  onOpen,
}: {
  patient: Patient
  onOpen: () => void
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {patient.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{patient.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {patient.patientId} · {patient.age} years · {patient.email}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3" />
            Last visit: {patient.lastVisit}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className={
            patient.status === "Needs review"
              ? "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
              : patient.status === "Follow-up"
                ? "rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                : "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          }
        >
          {patient.status}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={onOpen}
        >
          View record
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  )
}

function Appointment({
  name,
  reason,
  time,
  initials,
}: {
  name: string
  reason: string
  time: string
  initials: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{reason}</p>
      </div>
      <p className="shrink-0 text-xs font-medium tabular-nums">{time}</p>
    </div>
  )
}

function ActivityLine({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Check
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function PatientRecord({
  patient,
  onBack,
}: {
  patient: Patient
  onBack: () => void
}) {
  const screenings = useAppSelector((state) => state.workspace.screenings)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="-ml-3" onClick={onBack}>
        <ArrowRight className="size-4 rotate-180" />
        Back to patients
      </Button>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Patient record · sample</p>
          <h1 className="mt-1 text-2xl font-semibold">{patient.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.patientId} · {patient.age} years · {patient.email}
          </p>
        </div>
        <Button className="gap-2" onClick={() => document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth" })}>
          <FileImage className="size-4" />
          New image analysis
        </Button>
      </section>
      <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        This sample record is stored only in the current page state. Access
        control and record history require backend integration.
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Patient overview</CardTitle>
            <CardDescription>Profile details for this demo record</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <RecordDetail label="Patient ID" value={patient.patientId} />
            <RecordDetail label="Email" value={patient.email} />
            <RecordDetail label="Age" value={`${patient.age} years`} />
            <RecordDetail label="Last visit" value={patient.lastVisit} />
            <RecordDetail label="Record status" value={patient.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Screening history</CardTitle>
            <CardDescription>Previous scans and reports · sample</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {screenings.map((screening) => (
              <ScreeningHistoryItem
                key={screening.date}
                date={screening.date}
                grade={screening.grade}
                confidence={`${screening.confidence}%`}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <div id="analysis" className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload a fundus image</CardTitle>
            <CardDescription>
              Accepted formats: JPEG and PNG. Analysis is not connected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center hover:bg-muted/60">
              <FileImage className="size-7 text-primary" />
              <span className="font-medium">Choose an image</span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file && !["image/jpeg", "image/png"].includes(file.type)) {
                    setUploadMessage("Choose a JPEG or PNG fundus image.")
                    event.currentTarget.value = ""
                  } else if (file) {
                    setUploadMessage(
                      `${file.name} selected. Image analysis is not connected yet.`
                    )
                  }
                }}
              />
            </label>
            {uploadMessage && (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {uploadMessage}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecordDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function ScreeningHistoryItem({
  date,
  grade,
  confidence,
}: {
  date: string
  grade: string
  confidence: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Activity className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{grade}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{confidence} confidence</span>
    </div>
  )
}
