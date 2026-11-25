"use client"

/** Multi-line version of TextField, bound to react-hook-form. */

import type { ReactNode } from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { FormFieldError } from "@/components/form/form-error"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function TextareaField<
  T extends FieldValues,
  TOut extends FieldValues = T,
>({
  control,
  name,
  label,
  rows = 3,
  placeholder,
  description,
  disabled,
  className,
}: {
  control: Control<T, unknown, TOut>
  name: FieldPath<T>
  label: string
  rows?: number
  placeholder?: string
  description?: ReactNode
  disabled?: boolean
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
          <Textarea
            {...field}
            value={field.value ?? ""}
            id={field.name}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            className="min-h-0 rounded-none bg-background px-3.5 py-2.5 text-[15px] md:text-[15px]"
          />
          {description && !fieldState.invalid && (
            <FieldDescription className="text-xs text-subtle">
              {description}
            </FieldDescription>
          )}
          <FormFieldError error={fieldState.error} />
        </Field>
      )}
    />
  )
}
