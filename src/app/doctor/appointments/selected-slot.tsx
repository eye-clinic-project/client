"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { DetailList, Panel } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { useDeleteAvailabilityMutation } from "@/services/appointment.service"
import type { Appointment, Slot } from "@/types/api"

/** Details/actions for the clicked slot (delete if open, patient info if booked). */
export function SelectedSlot({
  slot,
  appointment,
  onRemoved,
}: {
  slot: Slot | null
  appointment: Appointment | undefined
  onRemoved: () => void
}) {
  const t = useTranslations("appointments")
  const tc = useTranslations("common")
  const format = useFormat()
  const errorText = useErrorText()
  const [remove, { isLoading }] = useDeleteAvailabilityMutation()
  if (!slot)
    return (
      <p className="border border-dashed border-border px-4 py-3 text-sm text-subtle">
        {t("selectHint")}
      </p>
    )
  const heading = `${format.fullDate(slot.startAt)} · ${format.time(slot.startAt)}–${format.time(slot.endAt)}`
  return (
    <Panel title={heading}>
      {slot.isBooked && appointment ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={appointment.patient?.name ?? "?"}
              src={appointment.patient?.avatarUrl ?? null}
            />
            <span className="flex flex-col">
              <span className="font-semibold">
                {t("bookedBy", { name: appointment.patient?.name ?? "" })}
              </span>
              <StatusChip
                tone={appointment.status === "completed" ? "success" : "info"}
                className="self-start"
              >
                {tc(`appointmentStatus.${appointment.status}`)}
              </StatusChip>
            </span>
          </div>
          <DetailList
            items={[
              {
                label: t("visitReason"),
                value: appointment.reason || t("noReason"),
              },
            ]}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusChip tone="info">{t("openSlot")}</StatusChip>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              try {
                await remove(slot._id).unwrap()
                toast.success(t("removed"))
                onRemoved()
              } catch (caught) {
                toast.error(errorText(caught))
              }
            }}
            className="h-10 rounded-none px-4 text-danger hover:text-danger"
          >
            {t("removeSlot")}
          </Button>
        </div>
      )}
    </Panel>
  )
}
