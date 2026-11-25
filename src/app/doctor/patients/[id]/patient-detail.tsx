"use client"

/**
 * Patient record page: header (MRN, age, gender, city), latest result, and tabs for
 * analysis history, reports, visits and notes. Actions: message, new analysis,
 * edit profile, unassign.
 *
 * This file only loads data and lays the page out; each section is its own file.
 */

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { TabBar } from "@/components/page/tab-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { useListAnalysesQuery } from "@/services/analysis.service"
import { useListMyAppointmentsQuery } from "@/services/appointment.service"
import { useGetPatientQuery } from "@/services/patient.service"
import { useListReportsQuery } from "@/services/report.service"

import { AnalysisHistory } from "./analysis-history"
import { EditPatientDialog } from "./edit-patient-dialog"
import { PatientHeader } from "./patient-header"
import { MedicalNotesPanel, ProfilePanel } from "./patient-panels"
import { ReportList } from "./report-list"
import { UnassignDialog } from "./unassign-dialog"
import { VisitList } from "./visit-list"

type Tab = "history" | "reports" | "appointments" | "notes"

export function PatientDetail({ id }: { id: string }) {
  const t = useTranslations("patients")
  const [tab, setTab] = useState<Tab>("history")
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const { data: patient, isLoading, isError, refetch } = useGetPatientQuery(id)
  const skip = !patient
  const { data: analyses } = useListAnalysesQuery(
    { patientId: id, size: 50 },
    { skip }
  )
  const { data: reports } = useListReportsQuery(
    { patientId: id, size: 50 },
    { skip }
  )
  // No per-patient appointment endpoint: load the doctor's appointments and filter below.
  const { data: appointments } = useListMyAppointmentsQuery(
    { size: 100 },
    { skip }
  )

  if (isLoading) return <Skeleton className="h-64 w-full rounded-none" />
  if (isError || !patient)
    return <ErrorState message={t("detail.notFound")} onRetry={refetch} />

  const latest = analyses?.docs.find((item) => item.status === "completed")
  const visits =
    appointments?.docs.filter(
      (item) => item.patient?._id === patient.user._id
    ) ?? []
  const edit = () => setEditing(true)

  return (
    <div className="flex flex-col gap-6">
      <PatientHeader
        patient={patient}
        latest={latest}
        onEdit={edit}
        onUnassign={() => setConfirming(true)}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <TabBar
            label={t("detail.tabs")}
            value={tab}
            onChange={setTab}
            items={[
              {
                value: "history",
                label: t("detail.history"),
                count: analyses?.count,
              },
              {
                value: "reports",
                label: t("detail.reports"),
                count: reports?.count,
              },
              {
                value: "appointments",
                label: t("detail.appointments"),
                count: visits.length,
              },
              { value: "notes", label: t("detail.notes") },
            ]}
          />
          {tab === "history" && <AnalysisHistory analyses={analyses?.docs} />}
          {tab === "reports" && <ReportList reports={reports?.docs} />}
          {tab === "appointments" && <VisitList visits={visits} />}
          {tab === "notes" && (
            <MedicalNotesPanel notes={patient.medicalNotes} onEdit={edit} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <ProfilePanel patient={patient} onEdit={edit} />
          <Panel title={t("detail.visits")}>
            <VisitList visits={visits.slice(0, 3)} compact />
          </Panel>
          <MedicalNotesPanel notes={patient.medicalNotes} />
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="self-start text-sm font-semibold text-danger hover:underline"
          >
            {t("unassign")}
          </button>
        </div>
      </div>

      {editing && (
        <EditPatientDialog
          patient={patient}
          onClose={() => setEditing(false)}
        />
      )}
      <UnassignDialog
        patient={patient}
        open={confirming}
        onOpenChange={setConfirming}
      />
    </div>
  )
}
