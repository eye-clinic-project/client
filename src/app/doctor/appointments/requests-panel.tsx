"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { StatusChip } from "@/components/common/status-chip"
import { UserAvatar } from "@/components/common/user-avatar"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { DetailList } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useFormat } from "@/lib/i18n/use-labels"
import { useDecideRequestMutation } from "@/services/appointment.service"
import type { Appointment } from "@/types/api"

/** Patients' pending cancel/reschedule requests with approve/reject. */
export function RequestsPanel({ requests }: { requests: Appointment[] }) {
  const t = useTranslations("appointments")
  const format = useFormat()
  const errorText = useErrorText()
  const [decide, { isLoading }] = useDecideRequestMutation()
  const [pending, setPending] = useState<{
    appointment: Appointment
    decision: "approve" | "reject"
  } | null>(null)
  const [note, setNote] = useState("")

  return (
    <aside
      aria-labelledby="requests-title"
      className="flex flex-col border border-border bg-card"
    >
      <h2
        id="requests-title"
        className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-[15px] font-semibold"
      >
        {t("requests")}
        {requests.length > 0 && (
          <span className="bg-warning-soft px-2 py-0.5 text-xs text-warning">
            {requests.length}
          </span>
        )}
      </h2>
      {requests.length === 0 ? (
        <p className="px-5 py-4 text-sm text-subtle">{t("noRequests")}</p>
      ) : (
        <ul className="flex flex-col">
          {requests.map((appointment) => {
            const request = appointment.changeRequest
            if (!request) return null
            return (
              <li
                key={appointment._id}
                className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0"
              >
                <StatusChip tone="warning" className="self-start">
                  {request.type === "cancel"
                    ? t("cancelRequest")
                    : t("rescheduleRequest")}
                </StatusChip>
                <span className="flex items-center gap-2.5">
                  <UserAvatar
                    name={appointment.patient?.name ?? "?"}
                    src={appointment.patient?.avatarUrl ?? null}
                  />
                  <span className="font-semibold">
                    {appointment.patient?.name}
                  </span>
                </span>
                <DetailList
                  items={[
                    {
                      label: t("current"),
                      value: `${format.fullDate(appointment.scheduledAt)}, ${format.time(appointment.scheduledAt)}`,
                    },
                    ...(request.type === "reschedule" && request.scheduledAt
                      ? [
                          {
                            label: t("requested"),
                            value: `${format.fullDate(request.scheduledAt)}, ${format.time(request.scheduledAt)}`,
                          },
                        ]
                      : []),
                    { label: t("reason"), value: request.reason },
                  ]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() =>
                      setPending({ appointment, decision: "approve" })
                    }
                    className="h-10 rounded-none"
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPending({ appointment, decision: "reject" })
                    }
                    className="h-10 rounded-none"
                  >
                    {t("reject")}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null)
            setNote("")
          }
        }}
        title={
          pending?.decision === "approve" ? t("approveTitle") : t("rejectTitle")
        }
        description={
          pending?.decision === "reject"
            ? t("rejectBody")
            : pending?.appointment.changeRequest?.type === "cancel"
              ? t("approveCancelBody")
              : t("approveRescheduleBody")
        }
        confirmLabel={
          pending?.decision === "approve" ? t("approve") : t("reject")
        }
        destructive={pending?.decision === "reject"}
        pending={isLoading}
        onConfirm={async () => {
          if (!pending) return
          try {
            await decide({
              id: pending.appointment._id,
              decision: pending.decision,
              note: note.trim() || undefined,
            }).unwrap()
            toast.success(
              pending.decision === "approve" ? t("approved") : t("rejected")
            )
            setPending(null)
            setNote("")
          } catch (caught) {
            toast.error(errorText(caught))
          }
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("decisionNote")}
          <Textarea
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="rounded-none"
          />
        </label>
      </ConfirmDialog>
    </aside>
  )
}
