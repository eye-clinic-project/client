"use client"

import { useTranslations } from "next-intl"
import type { Control, FieldPath, FieldValues } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { TextareaField } from "@/components/form/textarea-field"
import type { CreatePatientInput } from "@/validation/patient.schema"

export function PatientFields<T extends FieldValues, TOut extends FieldValues>({
  control,
  withEmail,
}: {
  control: Control<T, unknown, TOut>
  withEmail: boolean
}) {
  const t = useTranslations("patients.form")
  const field = (name: keyof CreatePatientInput) => name as FieldPath<T>
  return (
    <div className="flex flex-col gap-4">
      <TextField
        control={control}
        name={field("name")}
        label={t("name")}
        autoComplete="off"
      />
      {withEmail && (
        <TextField
          control={control}
          name={field("email")}
          label={t("email")}
          type="email"
          autoComplete="off"
          dir="ltr"
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={field("city")} label={t("city")} />
        <TextField
          control={control}
          name={field("phone")}
          label={t("phone")}
          type="tel"
          dir="ltr"
        />
        <TextField
          control={control}
          name={field("dateOfBirth")}
          label={t("dateOfBirth")}
          type="date"
        />
        <SelectField
          control={control}
          name={field("gender")}
          label={t("gender")}
          placeholder={t("genderUnset")}
          options={[
            { value: "female", label: t("female") },
            { value: "male", label: t("male") },
          ]}
        />
        <TextField
          control={control}
          name={field("diabetesSince")}
          label={t("since")}
          type="number"
          inputMode="numeric"
          placeholder={t("sincePlaceholder")}
        />
        <TextField
          control={control}
          name={field("emergencyContact")}
          label={t("emergency")}
        />
      </div>
      <TextareaField
        control={control}
        name={field("medicalNotes")}
        label={t("notes")}
        rows={3}
      />
    </div>
  )
}
