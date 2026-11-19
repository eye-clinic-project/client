"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { appointmentTone } from "@/components/appointment/appointment-tone"
import { SlotPicker } from "@/components/appointment/slot-picker"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextareaField } from "@/components/form/textarea-field"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { PageHeader } from "@/components/page/page-header"
import { DetailList, Panel } from "@/components/page/panel"
import { ErrorState } from "@/components/page/states"
import { StatusChip } from "@/components/status-chip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useFormat } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useGetAppointmentQuery,
  useRequestCancelMutation,
  useRequestRescheduleMutation,
  useWithdrawRequestMutation,
} from "@/service/appointment.service"
import type { Appointment, Slot } from "@/types/api"
import {
  cancelRequestSchema,
  rescheduleRequestSchema,
} from "@/validation/appointment.schema"

export function VisitDetail({ id }: { id: string }) {
  const t = useTranslations("patient.visits")
  const ta = useTranslations("appointments")
  const tc = useTranslations("common")
  const format = useFormat()
  const errorText = useErrorText()
  const {
    data: appointment,
    isLoading,
    isError,
    refetch,
  } = useGetAppointmentQuery(id)
  const [withdraw, { isLoading: withdrawing }] = useWithdrawRequestMutation()
  const [dialog, setDialog] = useState<
    "cancel" | "reschedule" | "withdraw" | null
  >(null)

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !appointment) return <ErrorState onRetry={refetch} />

  const request = appointment.changeRequest
  const pending = request?.status === "pending" ? request : null
  const upcoming = new Date(appointment.scheduledAt) > new Date()
  const actionable =
    upcoming &&
    !pending &&
    (appointment.status === "pending" || appointment.status === "confirmed")
  const minutes = appointment.endAt
    ? Math.round(
        (new Date(appointment.endAt).getTime() -
          new Date(appointment.scheduledAt).getTime()) /
          60000
      )
    : null
  const doctorName = tc("doctorName", { name: appointment.doctor?.name ?? "" })

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/patient/appointments"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>
      <PageHeader
        eyebrow={format.fullDate(appointment.scheduledAt)}
        title={`${format.time(appointment.scheduledAt)} · ${doctorName}`}
        actions={
          <>
            {appointment.doctor && (
              <Link
                href={`/patient/messages?doctor=${appointment.doctor._id}`}
                className="inline-flex min-h-10 items-center gap-2 border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                <MessageSquareIcon className="size-4" aria-hidden="true" />
                {t("message")}
              </Link>
            )}
            {actionable && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDialog("reschedule")}
                  className="h-10 rounded-none px-4"
                >
                  {t("reschedule")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialog("cancel")}
                  className="h-10 rounded-none px-4 text-danger hover:text-danger"
                >
                  {t("cancel")}
                </Button>
              </>
            )}
          </>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {pending && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 border-s-[3px] border-warning bg-warning-soft px-4 py-3 text-sm"
            >
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{t("request")}</span>
                <span>
                  {pending.type === "cancel"
                    ? t("requestCancel")
                    : t("requestReschedule", {
                        time: format.dateTime(
                          pending.scheduledAt ?? appointment.scheduledAt
                        ),
                      })}
                </span>
                {pending.reason && (
                  <span className="text-muted-foreground">
                    “{pending.reason}”
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                onClick={() => setDialog("withdraw")}
                className="h-9 rounded-none bg-card px-3 text-[13px]"
              >
                {t("withdraw")}
              </Button>
            </div>
          )}
          {request?.status === "rejected" && (
            <div
              role="status"
              className="border-s-[3px] border-danger bg-danger-soft px-4 py-3 text-sm"
            >
              {t("requestRejected")}
            </div>
          )}
          <Panel title={t("details")}>
            <DetailList
              items={[
                { label: t("doctor"), value: doctorName },
                {
                  label: t("when"),
                  value: t("whenValue", {
                    date: format.fullDate(appointment.scheduledAt),
                    time: format.time(appointment.scheduledAt),
                  }),
                },
                ...(minutes
                  ? [
                      {
                        label: t("duration"),
                        value: tc("minutes", { count: minutes }),
                      },
                    ]
                  : []),
                {
                  label: t("status"),
                  value: (
                    <StatusChip tone={appointmentTone(appointment)}>
                      {tc(`appointmentStatus.${appointment.status}`)}
                    </StatusChip>
                  ),
                },
                {
                  label: t("reason"),
                  value: appointment.reason ?? t("noReason"),
                },
                ...(appointment.status === "cancelled" &&
                appointment.cancelReason
                  ? [
                      {
                        label: t("cancelledReason"),
                        value: appointment.cancelReason,
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>
        </div>
        {appointment.rescheduleHistory &&
          appointment.rescheduleHistory.length > 0 && (
            <Panel title={t("history")}>
              <ol className="flex flex-col gap-3">
                {appointment.rescheduleHistory.map((entry) => (
                  <li
                    key={entry.at}
                    className="flex flex-col gap-0.5 border-s-2 border-border ps-3 text-sm"
                  >
                    <span className="font-semibold">
                      {t("historyEntry", {
                        from: format.dateTime(entry.from),
                        to: format.dateTime(entry.to),
                      })}
                    </span>
                    <span className="text-xs text-subtle">
                      {ta(`rescheduleReasons.${entry.reason}`)} ·{" "}
                      {format.date(entry.at)}
                    </span>
                    {entry.note && (
                      <span className="text-[13px] text-muted-foreground">
                        {entry.note}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
      </div>
      {dialog === "cancel" && (
        <CancelDialog
          appointment={appointment}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reschedule" && (
        <RescheduleDialog
          appointment={appointment}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        open={dialog === "withdraw"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("withdraw")}
        confirmLabel={t("withdraw")}
        pending={withdrawing}
        onConfirm={async () => {
          try {
            await withdraw(appointment._id).unwrap()
            toast.success(t("withdrawn"))
            setDialog(null)
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      />
    </div>
  )
}

function RequestDialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto rounded-none p-6 text-sm sm:max-w-lg">
        <DialogHeader className="gap-2 text-start">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment
  onClose: () => void
}) {
  const t = useTranslations("patient.visits")
  const errorText = useErrorText()
  const [requestCancel] = useRequestCancelMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(cancelRequestSchema),
    defaultValues: { reason: "" },
  })

  const onSubmit = form.handleSubmit(async ({ reason }) => {
    setError(null)
    try {
      await requestCancel({ id: appointment._id, reason }).unwrap()
      toast.success(t("cancelSent"))
      onClose()
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <RequestDialog
      title={t("cancelTitle")}
      description={t("cancelBody")}
      onClose={onClose}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <TextareaField
          control={form.control}
          name="reason"
          label={t("cancelReason")}
          rows={3}
        />
        <SubmitButton
          pending={form.formState.isSubmitting}
          className="bg-danger hover:bg-danger/90"
        >
          {t("cancel")}
        </SubmitButton>
      </form>
    </RequestDialog>
  )
}

function RescheduleDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment
  onClose: () => void
}) {
  const t = useTranslations("patient.visits")
  const ta = useTranslations("appointments")
  const errorText = useErrorText()
  const [requestReschedule] = useRequestRescheduleMutation()
  const [slot, setSlot] = useState<Slot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(rescheduleRequestSchema),
    defaultValues: { slotId: "", reason: "patient_request" as const, note: "" },
  })

  const onSubmit = form.handleSubmit(async (body) => {
    setError(null)
    try {
      await requestReschedule({ id: appointment._id, ...body }).unwrap()
      toast.success(t("rescheduleSent"))
      onClose()
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <RequestDialog
      title={t("rescheduleTitle")}
      description={t("rescheduleBody")}
      onClose={onClose}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        {appointment.doctor && (
          <SlotPicker
            doctorId={appointment.doctor._id}
            value={slot}
            invalid={Boolean(form.formState.errors.slotId)}
            onChange={(next) => {
              setSlot(next)
              form.setValue("slotId", next?._id ?? "", {
                shouldValidate: form.formState.isSubmitted,
              })
            }}
          />
        )}
        <FormFieldError error={form.formState.errors.slotId} />
        <SelectField
          control={form.control}
          name="reason"
          label={t("rescheduleReason")}
          options={(
            [
              "patient_request",
              "patient_emergency",
              "medical_follow_up",
              "other",
            ] as const
          ).map((value) => ({
            value,
            label: ta(`rescheduleReasons.${value}`),
          }))}
        />
        <TextareaField
          control={form.control}
          name="note"
          label={t("rescheduleNote")}
          rows={2}
        />
        <SubmitButton pending={form.formState.isSubmitting}>
          {t("reschedule")}
        </SubmitButton>
      </form>
    </RequestDialog>
  )
}
