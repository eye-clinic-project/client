"use client"

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { FormFieldError } from "@/components/form/form-error"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export const nativeSelectClass =
  "h-12 w-full rounded-none border border-input bg-background px-3 text-[15px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"

export function SelectField<
  T extends FieldValues,
  TOut extends FieldValues = T,
>({
  control,
  name,
  label,
  options,
  placeholder,
  className,
}: {
  control: Control<T, unknown, TOut>
  name: FieldPath<T>
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className={cn("gap-1.5", className)}
        >
          <FieldLabel htmlFor={field.name} className="text-sm font-medium">
            {label}
          </FieldLabel>
          <select
            {...field}
            value={field.value ?? ""}
            id={field.name}
            aria-invalid={fieldState.invalid}
            className={nativeSelectClass}
          >
            {placeholder !== undefined && (
              <option value="">{placeholder}</option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FormFieldError error={fieldState.error} />
        </Field>
      )}
    />
  )
}

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label
      htmlFor={id}
      className="flex flex-col gap-1 text-xs font-medium text-subtle"
    >
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-36 border border-border bg-background px-2.5 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
