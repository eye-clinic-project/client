"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  FileImage,
  FileText,
  MessageCircle,
  Plus,
  Search,
  Send,
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

export function DoctorPatientsPage() {
  const patients = useAppSelector((state) => state.workspace.patients)
  const dispatch = useAppDispatch()

  const [query, setQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePatientValues>({
    resolver: zodResolver(createPatientSchema),
  })

  const filteredPatients = useMemo(() => {

    const term = query.trim().toLowerCase()

    if (!term) return patients

    return patients.filter((patient) =>
      [patient.name, patient.patientId, patient.email].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [patients, query])

  
  function addPatient(values: CreatePatientValues) {
    dispatch(
      patientAdded({
        ...values,
        status: "Stable",
        lastVisit: "Just added",
      })
    )
    setShowForm(false)
    setMessage("Patient added to the shared sample list for this session.")
    reset()
  }

  return (
    <PageHeading
      eyebrow="Care team"
      title="Patients"
      description="Search and manage your assigned patient list."
      action={
        <Button className="gap-2" onClick={() => setShowForm((shown) => !shown)}>
          <Plus className="size-4" />
          {showForm ? "Close form" : "Add patient"}
        </Button>
      }
    >
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add patient</CardTitle>
            <CardDescription>
              Demo only: the new entry is shared across doctor pages for this session.
            </CardDescription>
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
                  <Input id="patient-name" {...register("name")} />
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-id">Patient ID</FieldLabel>
                  <Input id="patient-id" {...register("patientId")} />
                  <FieldError>{errors.patientId?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-email">Email</FieldLabel>
                  <Input
                    id="patient-email"
                    type="email"
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-age">Age</FieldLabel>
                  <Input
                    id="patient-age"
                    type="number"
                    {...register("age")}
                  />
                  <FieldError>{errors.age?.message}</FieldError>
                </Field>
              </FieldGroup>
              <Button type="submit">Save patient</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Assigned patients
            </CardTitle>
            <CardDescription className="mt-1">
              {patients.length} sample patients · search by name, ID, or email
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search assigned patients"
              className="pl-9"
              placeholder="Search patients..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredPatients.length ? (
            filteredPatients.map((patient) => (
              <PatientRow
                key={patient.patientId}
                patient={patient}
                onView={() =>
                  setMessage(
                    `Patient record for ${patient.name} is sample content.`
                  )
                }
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No patients found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another name, patient ID, or email address.
              </p>
            </div>
          )}
          {message && (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </PageHeading>
  )
}

export function DoctorAnalysisPage() {

  const screenings = useAppSelector((state) => state.workspace.screenings)
  

  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  

  function selectFile(selected?: File) {
    setFile(null)
    if (!selected) {
      setFeedback(null)
      return
    }
    if (!["image/jpeg", "image/png"].includes(selected.type)) {
      setFeedback("Unsupported format. Choose a JPEG or PNG image.")
      return
    }
    setFile(selected)
    setFeedback(
      `${selected.name} selected. Upload and AI analysis aren’t connected yet.`
    )
  }

  return (
    <PageHeading
      eyebrow="Clinical tools"
      title="Image analysis"
      description="Select a fundus image to prepare a screening. Analysis is currently a prototype."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Upload fundus image</CardTitle>
            <CardDescription>
              Supported formats: JPEG and PNG. No file is uploaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center transition-colors hover:bg-muted/60">
              <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                <FileImage className="size-6" />
              </span>
              <span className="font-medium">
                {file ? file.name : "Choose an image"}
              </span>
              <span className="text-sm text-muted-foreground">
                Click to browse your device
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) =>
                  selectFile(event.currentTarget.files?.[0])
                }
              />
            </label>
            {feedback && (
              <p
                className="mt-4 text-sm text-muted-foreground"
                role="status"
              >
                {feedback}
              </p>
            )}
            <Button
              className="mt-5 w-full"
              disabled={!file}
              onClick={() =>
                setFeedback(
                  "Image analysis isn’t connected. The selected file was not sent."
                )
              }
            >
              <Activity className="size-4" />
              Start screening
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Before you upload</CardTitle>
              <CardDescription>
                Image checks for the planned screening flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <CheckLine text="Use a clear, centered fundus image" />
              <CheckLine text="Accepted file types: JPEG or PNG" />
              <CheckLine text="A size limit will be shown when configured" />
              <CheckLine text="AI results require doctor confirmation" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent screenings</CardTitle>
              <CardDescription>Latest sample analysis activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {screenings.slice(0, 2).map((screening) => (
                <div key={screening.date} className="flex items-center gap-3">
                  <Activity className="size-4 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {screening.grade}
                    </p>
                    <p className="text-xs text-muted-foreground">{screening.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageHeading>
  )
}

export function DoctorAppointmentsPage() {

  const allAppointments = useAppSelector((state) => state.workspace.appointments)
  const appointments = useMemo(() => allAppointments.filter((item) => item.patient !== "Alex Morgan"),[allAppointments])
  const [appointmentMessage, setAppointmentMessage] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Schedule"
      title="Appointments"
      description="Review today’s visits and planned follow-ups."
      action={
        <Button
          variant="outline"
          onClick={() =>
            setAppointmentMessage(
              "Appointment scheduling isn’t connected yet."
            )
          }
        >
          <Plus className="size-4" />
          New appointment
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Today · Tuesday, October 20</CardTitle>
          <CardDescription>{appointments.length} scheduled visits · local sample data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{appointment.patient}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.reason}
                </p>
                <p className="text-xs text-muted-foreground">{appointment.date}</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock3 className="size-4" />
                  {appointment.time}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {appointment.status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAppointmentMessage(
                      `${appointment.patient}’s appointment actions aren’t connected yet.`
                    )
                  }
                >
                  Manage
                </Button>
              </div>
            </div>
          ))}
          {appointmentMessage && (
            <p className="text-sm text-muted-foreground" role="status">
              {appointmentMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </PageHeading>
  )
}

export function DoctorMessagesPage() {

  const conversations = useAppSelector((state) => state.workspace.conversations)
  const [message, setMessage] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Care team"
      title="Messages"
      description="Communication with assigned patients will appear here."
    >
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Recent sample activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversations
              .filter((conversation) => conversation.patient !== "Alex Morgan")
              .map((conversation) => (
                <button
                  key={conversation.patient}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                  onClick={() => setFeedback(`Showing sample conversation with ${conversation.patient}.`)}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {conversation.patient.split(" ").map((part) => part[0]).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{conversation.patient}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {conversation.latestMessage}
                    </span>
                  </span>
                </button>
              ))}
          </CardContent>
        </Card>
        <Card className="flex min-h-[26rem] flex-col">
          <CardHeader>
            <CardTitle>Patient communication</CardTitle>
            <CardDescription>
              Messages are a UI prototype and are not delivered or saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Choose a conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a patient to preview the conversation.
                </p>
              </div>
            </div>
            {feedback && (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {feedback}
              </p>
            )}
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setFeedback(
                  message.trim()
                    ? "Messaging isn’t connected. Your message was not sent."
                    : "Enter a message first."
                )
              }}
            >
              <Input
                aria-label="Write a message"
                placeholder="Write a message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <Button aria-label="Send message" type="submit" size="icon">
                <Send />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageHeading>
  )
}

export function PatientResultsPage() {
  const screenings = useAppSelector((state) => state.workspace.screenings)
  const [openedResult, setOpenedResult] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Eye health"
      title="My results"
      description="Your screening history, results, and next steps."
    >
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
        These are sample results for the prototype and are not medical advice.
        Discuss screening results with a qualified eye-care professional.
      </div>
      <div className="space-y-4">
        {screenings.map((screening, index) => (
          <Card key={screening.date}>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{screening.grade}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {screening.date} · Confidence {screening.confidence}%
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {index === 0
                    ? "Doctor review recommended. Please discuss this result with your care team."
                    : "This past screening result is shown for your records."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setOpenedResult(screening.date)}
              >
                View details
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
            {openedResult === screening.date && (
              <div className="border-t px-6 py-4 text-sm text-muted-foreground">
                Detailed scan images and reports aren’t available in this
                prototype.
              </div>
            )}
          </Card>
        ))}
      </div>
    </PageHeading>
  )
}

export function PatientAppointmentsPage() {
  const appointment = useAppSelector((state) =>
    state.workspace.appointments.find((item) => item.patient === "Alex Morgan")
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Care plan"
      title="Appointments"
      description="See your upcoming visits with your eye-care team."
      action={
        <Button
          variant="outline"
          onClick={() => setFeedback("Appointment booking isn’t connected yet.")}
        >
          <Plus className="size-4" />
          Request appointment
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>All times shown in your local time zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{appointment?.reason}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dr. Taylor · {appointment?.date} at {appointment?.time}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment?.location}</p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setFeedback("Rescheduling isn’t connected yet. No changes were made.")
              }
            >
              Reschedule
            </Button>
          </div>
          {feedback && (
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              {feedback}
            </p>
          )}
        </CardContent>
      </Card>
    </PageHeading>
  )
}

export function PatientReportsPage() {
  const allReports = useAppSelector((state) => state.workspace.reports)
  const reports = useMemo(
    () => allReports.filter((report) => report.status === "Shared"),
    [allReports]
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Documents"
      title="Reports"
      description="Reports shared with you by your doctor."
    >
      <Card>
        <CardHeader>
          <CardTitle>Shared reports</CardTitle>
          <CardDescription>
            A report will be listed here when your doctor shares it with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                <FileText className="size-6" />
              </span>
              <p className="mt-4 font-medium">No reports shared yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Your doctor’s screening reports and PDF downloads will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="rounded-xl border p-4">
                  <p className="font-medium">Screening report</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.date} · {report.status}
                  </p>
                </article>
              ))}
            </div>
          )}
          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              setFeedback("Report delivery isn’t connected yet.")
            }
          >
            Check for reports
          </Button>
          {feedback && (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              {feedback}
            </p>
          )}
        </CardContent>
      </Card>
    </PageHeading>
  )
}

export function PatientMessagesPage() {
  const conversation = useAppSelector((state) =>
    state.workspace.conversations.find((item) => item.patient === "Alex Morgan")
  )
  const [message, setMessage] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <PageHeading
      eyebrow="Care team"
      title="Messages"
      description="Contact your doctor about your care and screening results."
    >
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            Conversation with Dr. Taylor
          </CardTitle>
          <CardDescription>
            Prototype conversation · messages aren’t delivered or saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-6">
            {conversation?.messages.map((item, index) => (
              <div
                key={`${item.sender}-${item.time}-${index}`}
                className={
                  item.sender === "patient"
                    ? "ml-auto max-w-[85%] rounded-xl bg-primary p-3 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-xl border bg-background p-3 text-sm"
                }
              >
                {item.text}
                <p
                  className={
                    item.sender === "patient"
                      ? "mt-2 text-xs text-primary-foreground/70"
                      : "mt-2 text-xs text-muted-foreground"
                  }
                >
                  {item.sender === "patient" ? "You" : "Dr. Taylor"} · {item.time}
                </p>
              </div>
            ))}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              setFeedback(
                message.trim()
                  ? "Messaging isn’t connected. Your message was not sent."
                  : "Enter a message first."
              )
            }}
          >
            <Input
              aria-label="Write a message"
              placeholder="Write a message..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button aria-label="Send message" type="submit" size="icon">
              <Send />
            </Button>
          </form>
          {feedback && (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              {feedback}
            </p>
          )}
        </CardContent>
      </Card>
    </PageHeading>
  )
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  )
}

function PatientRow({
  patient,
  onView,
}: {
  patient: Patient
  onView: () => void
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{patient.name}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {patient.patientId} · {patient.age} years · {patient.email}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          Last visit: {patient.lastVisit}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {patient.status}
        </span>
        <Button variant="ghost" size="sm" onClick={onView}>
          View record
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  )
}

function CheckLine({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{text}</span>
    </p>
  )
}
