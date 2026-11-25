"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useUnassignPatientMutation } from "@/services/doctor.service"
import type { Patient } from "@/types/api"

/** Confirms removing the patient from this doctor, then returns to the patient list. */
export function UnassignDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("patients")
  const router = useRouter()
  const errorText = useErrorText()
  const [unassign, { isLoading }] = useUnassignPatientMutation()

  const confirm = async () => {
    try {
      await unassign(patient._id).unwrap()
      toast.success(t("detail.unassigned"))
      router.replace("/doctor/patients")
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("detail.unassignTitle", { name: patient.user.name })}
      description={t("detail.unassignBody")}
      confirmLabel={t("unassign")}
      destructive
      pending={isLoading}
      onConfirm={confirm}
    />
  )
}
