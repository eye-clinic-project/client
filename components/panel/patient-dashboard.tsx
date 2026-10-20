"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const screeningHistory = [
  {
    date: "October 20, 2026",
    result: "Moderate diabetic retinopathy",
    confidence: 92,
    status: "Doctor review recommended",
    tone: "amber",
  },
  {
    date: "April 12, 2026",
    result: "Mild diabetic retinopathy",
    confidence: 88,
    status: "Report available",
    tone: "blue",
  },
  {
    date: "October 06, 2025",
    result: "No signs of diabetic retinopathy",
    confidence: 95,
    status: "Report available",
    tone: "green",
  },
] as const

export function PatientDashboard() {
  const latestScreening = screeningHistory[0]
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [historyMessage, setHistoryMessage] = useState<string | null>(null)
  const [appointmentMessage, setAppointmentMessage] = useState<string | null>(
    null
  )
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <section
        id="overview"
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-sm font-medium text-primary">Patient portal</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good morning, Alex
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your eye health updates and upcoming care.
          </p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/doctor/demo">
            Preview doctor workspace
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        Sample patient view. These example screening results are not real medical
        data and are not a diagnosis.
      </div>

      <section id="results" aria-label="Latest screening result">
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Latest screening</CardTitle>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Review recommended
                  </span>
                </div>
                <CardDescription>Fundus image analysis · October 20, 2026</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Screening result</p>
                  <p className="mt-1 text-xl font-semibold">
                    {latestScreening.result}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    This screening result should be discussed with your eye-care
                    doctor. It does not replace a clinical examination.
                  </p>
                </div>
                <div className="max-w-md space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Model confidence
                    </span>
                    <span className="font-medium">{latestScreening.confidence}%</span>
                  </div>
                  <Progress
                    value={latestScreening.confidence}
                    aria-label={`Model confidence ${latestScreening.confidence}%`}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Confidence is a model score, not a measure of diagnosis certainty.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="gap-2"
                    onClick={() =>
                      setActionMessage(
                        "Reports are not connected yet. No report was opened."
                      )
                    }
                  >
                    <FileText className="size-4" />
                    View report
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setActionMessage(
                        "Messaging is not connected yet. No message was sent."
                      )
                    }
                  >
                    <MessageCircle className="size-4" />
                    Contact doctor
                  </Button>
                </div>
                {actionMessage && (
                  <p className="text-sm text-muted-foreground" role="status">
                    {actionMessage}
                  </p>
                )}
              </CardContent>
            </div>
            <div className="border-t bg-muted/30 p-5 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Image preview</p>
                  <p className="text-xs text-muted-foreground">
                    Heatmap unavailable in sample data
                  </p>
                </div>
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-dashed bg-background">
                <div className="max-w-48 px-5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Fundus image</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The image and Grad-CAM overlay will appear here when available.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t bg-muted/20 px-6 py-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              AI screening supports clinical review and does not replace a
              diagnosis by a qualified eye-care professional.
            </p>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Screening history</CardTitle>
              <CardDescription className="mt-1">
                Your previous eye screening results
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() =>
                setHistoryMessage(
                  "Screening history is sample data and is not connected to your account."
                )
              }
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {screeningHistory.map((screening) => (
              <ScreeningCard key={screening.date} screening={screening} />
            ))}
            {historyMessage && (
              <p className="text-sm text-muted-foreground" role="status">
                {historyMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card id="appointments">
            <CardHeader>
              <CardTitle>Next appointment</CardTitle>
              <CardDescription>Your upcoming care</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Eye health follow-up</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dr. Taylor · Thursday, Oct 29
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    10:30 AM · In clinic
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() =>
                  setAppointmentMessage(
                    "Appointment management is not connected yet."
                  )
                }
              >
                Manage appointment
              </Button>
              {appointmentMessage && (
                <p className="mt-3 text-sm text-muted-foreground" role="status">
                  {appointmentMessage}
                </p>
              )}
            </CardContent>
          </Card>
          <Card id="reports">
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Reports shared by your doctor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    Screening report · Oct 20
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Awaiting doctor review
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Reports and PDF downloads will appear here after your doctor
                shares them.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card id="messages">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Have a question?</CardTitle>
            <CardDescription className="mt-1">
              Contact your care team about your screening or next appointment.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              setMessageFeedback(
                "Messaging is not connected yet. No message was sent."
              )
            }
          >
            <MessageCircle className="size-4" />
            Open messages
          </Button>
        </CardContent>
      </Card>
      {messageFeedback && (
        <p className="text-sm text-muted-foreground" role="status">
          {messageFeedback}
        </p>
      )}
    </div>
  )
}

function ScreeningCard({
  screening,
}: {
  screening: (typeof screeningHistory)[number]
}) {
  const toneClasses: Record<(typeof screeningHistory)[number]["tone"], string> = {
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Activity className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{screening.result}</p>
          <p className="mt-1 text-xs text-muted-foreground">{screening.date}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[screening.tone]}`}
        >
          {screening.status}
        </span>
        <span className="text-xs text-muted-foreground">
          {screening.confidence}%
        </span>
      </div>
    </article>
  )
}
