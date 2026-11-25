"use client"

/** Settings → Clinic (doctors): clinic name, address, specialty, bio, years of experience. */

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import { Panel } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { useUpdateMyClinicMutation } from "@/services/doctor.service"
import type { DoctorClinic } from "@/types/api"
import { clinicSchema } from "@/validation/settings.schema"

export function ClinicSection({ clinic }: { clinic: DoctorClinic }) {
  const t = useTranslations("settings.clinic")
  const tc = useTranslations("common")
  const errorText = useErrorText()
  const [save] = useUpdateMyClinicMutation()
  const defaults = {
    clinicName: clinic.clinicName,
    clinicAddress: clinic.clinicAddress,
    specialty: clinic.specialty ?? "",
    bio: clinic.bio ?? "",
    yearsOfExperience:
      clinic.yearsOfExperience === null ? "" : String(clinic.yearsOfExperience),
  }
  const form = useForm({
    resolver: zodResolver(clinicSchema),
    defaultValues: defaults,
  })

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      await save(body).unwrap()
      form.reset(form.getValues())
      toast.success(t("saved"))
    } catch (caught) {
      toast.error(errorText(caught))
    }
  })

  return (
    <Panel id="clinic" title={t("title")}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="clinicName"
            label={t("name")}
            autoComplete="organization"
          />
          <TextField
            control={form.control}
            name="specialty"
            label={t("specialty")}
          />
        </div>
        <TextField
          control={form.control}
          name="clinicAddress"
          label={t("address")}
          autoComplete="street-address"
        />
        <TextField
          control={form.control}
          name="yearsOfExperience"
          label={t("years")}
          type="number"
          inputMode="numeric"
          className="max-w-xs"
        />
        <TextareaField
          control={form.control}
          name="bio"
          label={t("bio")}
          rows={4}
          description={t("bioHint")}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!form.formState.isDirty}
            onClick={() => form.reset()}
            className="h-11 rounded-none px-4"
          >
            {tc("discard")}
          </Button>
          <SubmitButton
            pending={form.formState.isSubmitting}
            disabled={!form.formState.isDirty}
            className="h-11 w-auto px-5 text-sm"
          >
            {t("save")}
          </SubmitButton>
        </div>
      </form>
    </Panel>
  )
}
