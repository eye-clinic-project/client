"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { SlotPicker } from "@/components/appointment/slot-picker"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextareaField } from "@/components/form/textarea-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useRequestCancelMutation,
  useRequestRescheduleMutation,
} from "@/services/appointment.service"
import type { Appointment, Slot } from "@/types/api"
import {
  cancelRequestSchema,
  rescheduleRequestSchema,
} from "@/validation/appointment.schema"

/** Shared dialog frame for the request forms below. */
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

/** Ask the doctor to cancel (reason required). */
export function CancelDialog({
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

/** Ask the doctor to move the visit to another free slot (reason; note required for "other"). */
export function RescheduleDialog({
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
