"use client"

/**
 * Booking: choose one of my doctors, pick a free slot (SlotPicker), add an optional
 * reason, and book. Success opens the new appointment.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarPlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { SlotPicker } from "@/components/appointment/slot-picker"
import { UserAvatar } from "@/components/common/user-avatar"
import { FormAlert } from "@/components/form/form-alert"
import { FormFieldError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextareaField } from "@/components/form/textarea-field"
import { PageHeader } from "@/components/page/page-header"
import { Panel } from "@/components/page/panel"
import { EmptyState, ErrorState } from "@/components/page/states"
import { Skeleton } from "@/components/ui/skeleton"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import { useBookAppointmentMutation } from "@/services/appointment.service"
import { useListMyDoctorsQuery } from "@/services/doctor.service"
import type { Slot } from "@/types/api"
import { bookingSchema } from "@/validation/appointment.schema"

export function BookingForm({
  initialDoctorId,
}: {
  initialDoctorId: string | null
}) {
  const t = useTranslations("patient.book")
  const tc = useTranslations("common")
  const router = useRouter()
  const format = useFormat()
  const errorText = useErrorText()
  const { data: doctors, isLoading, isError, refetch } = useListMyDoctorsQuery()
  const [chosenDoctor, setChosenDoctor] = useState<string | null>(
    initialDoctorId
  )
  const [slot, setSlot] = useState<Slot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [book] = useBookAppointmentMutation()
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { slotId: "", reason: "" },
  })

  if (isLoading) return <Skeleton className="h-96 w-full rounded-none" />
  if (isError || !doctors) return <ErrorState onRetry={refetch} />

  // Use the chosen doctor if it's one of mine, otherwise default to the first.
  const doctorId = doctors.some((doctor) => doctor._id === chosenDoctor)
    ? chosenDoctor
    : (doctors[0]?._id ?? null)
  const doctor = doctors.find((item) => item._id === doctorId)

  const onSubmit = form.handleSubmit(async ({ slotId, reason }) => {
    setError(null)
    try {
      const appointment = await book({
        slotId,
        reason: reason || undefined,
      }).unwrap()
      toast.success(t("booked"))
      router.push(`/patient/appointments/${appointment._id}`)
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  const pick = (next: Slot | null) => {
    setSlot(next)
    form.setValue("slotId", next?._id ?? "", {
      shouldValidate: form.formState.isSubmitted,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {doctors.length === 0 || !doctor ? (
        <EmptyState icon={CalendarPlusIcon} title={t("noDoctors")} />
      ) : (
        <form
          noValidate
          onSubmit={onSubmit}
          className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="flex min-w-0 flex-col gap-6">
            {doctors.length > 1 && (
              <Panel title={t("doctor")}>
                <div
                  role="radiogroup"
                  aria-label={t("doctor")}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {doctors.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      role="radio"
                      aria-checked={item._id === doctorId}
                      onClick={() => {
                        setChosenDoctor(item._id)
                        pick(null)
                      }}
                      className={cn(
                        "flex items-center gap-3 border p-3 text-start",
                        item._id === doctorId
                          ? "border-primary bg-brand-soft"
                          : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <UserAvatar
                        name={item.name}
                        src={item.avatarUrl}
                        className="size-10"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">
                          {tc("doctorName", { name: item.name })}
                        </span>
                        <span className="truncate text-xs text-subtle">
                          {item.clinicName ?? item.specialty ?? item.city}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            )}
            <Panel title={t("time")} bodyClassName="gap-4">
              <SlotPicker
                key={doctor._id}
                doctorId={doctor._id}
                value={slot}
                onChange={pick}
                invalid={Boolean(form.formState.errors.slotId)}
              />
              <FormFieldError error={form.formState.errors.slotId} />
              <TextareaField
                control={form.control}
                name="reason"
                label={t("reason")}
                placeholder={t("reasonPlaceholder")}
                rows={3}
              />
            </Panel>
          </div>
          <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
            <Panel title={t("summary")} bodyClassName="gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={doctor.name}
                  src={doctor.avatarUrl}
                  className="size-11"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {tc("doctorName", { name: doctor.name })}
                  </span>
                  <span className="truncate text-xs text-subtle">
                    {[doctor.clinicName, doctor.clinicAddress]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </div>
              <p
                className={cn(
                  "border-t border-border pt-4 text-sm",
                  slot ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {slot
                  ? t("at", {
                      date: format.fullDate(slot.startAt),
                      time: format.time(slot.startAt),
                    })
                  : t("pickTime")}
              </p>
              {error && <FormAlert>{error}</FormAlert>}
              <SubmitButton
                pending={form.formState.isSubmitting}
                disabled={!slot}
              >
                {t("confirm")}
              </SubmitButton>
            </Panel>
          </aside>
        </form>
      )}
    </div>
  )
}
