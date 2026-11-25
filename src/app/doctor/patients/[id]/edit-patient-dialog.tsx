"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { PatientFields } from "@/components/patient/patient-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useUpdatePatientMutation } from "@/services/patient.service"
import type { Patient } from "@/types/api"
import { updatePatientSchema } from "@/validation/patient.schema"

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "")

/** Edit the patient's profile (email can't change). */
export function EditPatientDialog({
  patient,
  onClose,
}: {
  patient: Patient
  onClose: () => void
}) {
  const t = useTranslations("patients.form")
  const tc = useTranslations("common")
  const errorText = useErrorText()
  const [update] = useUpdatePatientMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(updatePatientSchema),
    defaultValues: {
      name: patient.user.name,
      city: patient.user.city,
      phone: patient.user.phone ?? "",
      dateOfBirth: toDateInput(patient.dateOfBirth),
      gender: patient.gender ?? ("" as const),
      emergencyContact: patient.emergencyContact ?? "",
      diabetesSince: patient.diabetesSince ? String(patient.diabetesSince) : "",
      medicalNotes: patient.medicalNotes ?? "",
    },
  })

  const onSubmit = form.handleSubmit(async (payload) => {
    setError(null)
    try {
      await update({ id: patient._id, ...payload }).unwrap()
      toast.success(t("updated"))
      onClose()
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] gap-5 overflow-y-auto rounded-none p-6 text-sm sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("editTitle")}
          </DialogTitle>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <PatientFields control={form.control} withEmail={false} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-none px-4"
            >
              {tc("cancel")}
            </Button>
            <SubmitButton
              pending={form.formState.isSubmitting}
              className="h-11 w-auto px-5 text-sm"
            >
              {tc("saveChanges")}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
