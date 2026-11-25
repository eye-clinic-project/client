"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { TextareaField } from "@/components/form/textarea-field"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useApproveDoctorMutation,
  useRejectDoctorMutation,
  useSetUserStatusMutation,
} from "@/services/admin.service"
import type { AdminDoctor } from "@/types/api"
import { rejectDoctorSchema } from "@/validation/admin.schema"

/** Which decision dialog is open (null = none). */
export type DecisionDialog = "approve" | "reject" | "status" | null

/** Approve / reject / (de)activate buttons and their dialogs. */
export function Decisions({
  doctor,
  dialog,
  onClose,
}: {
  doctor: AdminDoctor
  dialog: DecisionDialog
  onClose: () => void
}) {
  const t = useTranslations("admin")
  const errorText = useErrorText()
  const [approve, { isLoading: approving }] = useApproveDoctorMutation()
  const [reject, { isLoading: rejecting }] = useRejectDoctorMutation()
  const [setStatus, { isLoading: updating }] = useSetUserStatusMutation()
  const form = useForm({
    resolver: zodResolver(rejectDoctorSchema),
    defaultValues: { reason: "" },
  })
  const name = doctor.name

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      toast.success(message)
      onClose()
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }

  return (
    <>
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(open) => !open && onClose()}
        title={t("approveTitle", { name })}
        description={t("approveBody")}
        confirmLabel={t("approve")}
        pending={approving}
        onConfirm={() =>
          void run(
            () => approve(doctor._id).unwrap(),
            t("approvedToast", { name })
          )
        }
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(open) => {
          if (!open) {
            form.reset()
            onClose()
          }
        }}
        title={t("rejectTitle", { name })}
        description={t("rejectBody")}
        confirmLabel={t("reject")}
        destructive
        pending={rejecting}
        onConfirm={form.handleSubmit(({ reason }) =>
          run(
            () => reject({ id: doctor._id, reason }).unwrap(),
            t("rejectedToast", { name })
          )
        )}
      >
        <TextareaField
          control={form.control}
          name="reason"
          label={t("rejectReason")}
          rows={3}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "status"}
        onOpenChange={(open) => !open && onClose()}
        title={
          doctor.isActive
            ? t("deactivateTitle", { name })
            : t("activateTitle", { name })
        }
        description={doctor.isActive ? t("deactivateBody") : t("activateBody")}
        confirmLabel={doctor.isActive ? t("deactivate") : t("activate")}
        destructive={doctor.isActive}
        pending={updating}
        onConfirm={() =>
          void run(
            () =>
              setStatus({
                userId: doctor.userId,
                doctorId: doctor._id,
                isActive: !doctor.isActive,
              }).unwrap(),
            t("statusToast")
          )
        }
      />
    </>
  )
}
