"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { PatientFields } from "@/components/patient/patient-fields"
import { Button } from "@/components/ui/button"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useCreateClinicPatientMutation } from "@/service/doctor.service"
import type { Patient } from "@/types/api"
import { createPatientSchema, EMPTY_PATIENT } from "@/validation/patient.schema"

export function AddPatientPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (patient: Patient) => void
}) {
  const t = useTranslations("patients.form")
  const tc = useTranslations("common")
  const errorText = useErrorText()
  const [createPatient] = useCreateClinicPatientMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(createPatientSchema),
    defaultValues: EMPTY_PATIENT,
  })

  const onSubmit = form.handleSubmit(async (payload) => {
    setError(null)
    try {
      const patient = await createPatient(payload).unwrap()
      toast.success(t("created", { name: payload.name }))
      onCreated(patient)
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <aside
      aria-labelledby="add-patient-title"
      className="flex flex-col gap-5 self-start border border-border bg-card p-5 lg:sticky lg:top-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="add-patient-title" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={tc("close")}
          className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("lead")}
      </p>
      {error && <FormAlert>{error}</FormAlert>}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <PatientFields control={form.control} withEmail />
        <div className="flex flex-wrap justify-end gap-2">
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
            {t("create")}
          </SubmitButton>
        </div>
      </form>
    </aside>
  )
}
