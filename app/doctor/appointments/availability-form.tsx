"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useCreateAvailabilityMutation } from "@/service/appointment.service"
import { addDays, toDateInput } from "@/util/dates"
import {
  availabilitySchema,
  countSlots,
  type AvailabilityInput,
} from "@/validation/appointment.schema"

export function AvailabilityForm({
  onCreated,
}: {
  onCreated: (date: Date) => void
}) {
  const t = useTranslations("appointments.form")
  const tc = useTranslations("common")
  const errorText = useErrorText()
  const [create] = useCreateAvailabilityMutation()
  const form = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      date: toDateInput(addDays(new Date(), 1)),
      from: "09:00",
      to: "13:00",
      slotMinutes: "20",
      breakMinutes: "0",
    } satisfies AvailabilityInput,
  })
  const values = useWatch({ control: form.control }) as AvailabilityInput
  const count = countSlots(values)

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      const slots = await create(body).unwrap()
      toast.success(t("created", { count: slots.length }))
      onCreated(new Date(body.startAt))
    } catch (caught) {
      toast.error(errorText(caught))
    }
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={t("label")}
      className="flex flex-wrap items-end gap-4 border border-border bg-surface p-4"
    >
      <TextField
        control={form.control}
        name="date"
        label={t("date")}
        type="date"
        className="w-44"
        inputClassName="h-11"
      />
      <TextField
        control={form.control}
        name="from"
        label={t("from")}
        type="time"
        className="w-32"
        inputClassName="h-11"
      />
      <TextField
        control={form.control}
        name="to"
        label={t("to")}
        type="time"
        className="w-32"
        inputClassName="h-11"
      />
      <SelectField
        control={form.control}
        name="slotMinutes"
        label={t("length")}
        className="w-36"
        options={[15, 20, 30, 40, 60].map((value) => ({
          value: String(value),
          label: tc("minutes", { count: value }),
        }))}
      />
      <SelectField
        control={form.control}
        name="breakMinutes"
        label={t("break")}
        className="w-40"
        options={[0, 5, 10, 15].map((value) => ({
          value: String(value),
          label: value === 0 ? t("noBreak") : tc("minutes", { count: value }),
        }))}
      />
      <span
        className="min-h-11 content-center text-sm text-subtle"
        aria-live="polite"
      >
        {t("creates", { count })}
      </span>
      <SubmitButton
        pending={form.formState.isSubmitting}
        disabled={count === 0}
        className="h-11 w-auto px-5 text-sm"
      >
        {t("submit")}
      </SubmitButton>
    </form>
  )
}
