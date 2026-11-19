"use client"

import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { useTranslations } from "next-intl"

import { FormFieldError } from "@/components/form/form-error"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OtpFieldProps<T extends FieldValues, TOut extends FieldValues> {
  control: Control<T, unknown, TOut>
  name: FieldPath<T>
  label?: string
  srOnlyLabel?: boolean
}

export function OtpField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  srOnlyLabel = false,
}: OtpFieldProps<T, TOut>) {
  const t = useTranslations("auth.fields")
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <FieldLabel
            htmlFor={field.name}
            className={srOnlyLabel ? "sr-only" : "text-sm font-medium"}
          >
            {label ?? t("code")}
          </FieldLabel>
          <InputOTP
            id={field.name}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            containerClassName="w-full"
            dir="ltr"
          >
            <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  aria-label={t("digit", { index: index + 1 })}
                  className="h-14 w-full rounded-none border text-[22px] font-semibold first:rounded-none last:rounded-none"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FormFieldError error={fieldState.error} />
        </Field>
      )}
    />
  )
}
