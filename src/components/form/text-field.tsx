"use client"

/**
 * Text input bound to react-hook-form: label, optional description/label action,
 * and a translated error message. Generic over the form's input/output types.
 */

import type { ReactNode } from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { FormFieldError } from "@/components/form/form-error"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TextFieldProps<T extends FieldValues, TOut extends FieldValues> {
  control: Control<T, unknown, TOut>
  name: FieldPath<T>
  label: string
  type?:
    | "text"
    | "email"
    | "password"
    | "tel"
    | "search"
    | "number"
    | "date"
    | "datetime-local"
    | "time"
  autoComplete?: string
  placeholder?: string
  description?: ReactNode
  labelAction?: ReactNode
  disabled?: boolean
  readOnly?: boolean
  inputMode?: "numeric" | "tel" | "email" | "text"
  dir?: "ltr" | "rtl" | "auto"
  className?: string
  inputClassName?: string
}

export function TextField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  description,
  labelAction,
  disabled,
  readOnly,
  inputMode,
  dir,
  className,
  inputClassName,
}: TextFieldProps<T, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className={cn("gap-1.5", className)}
        >
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor={field.name} className="text-sm font-medium">
              {label}
            </FieldLabel>
            {labelAction}
          </div>
          <Input
            {...field}
            value={field.value ?? ""}
            id={field.name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            inputMode={inputMode}
            dir={dir}
            aria-invalid={fieldState.invalid}
            className={cn(
              "h-12 rounded-none bg-background px-3.5 text-[15px] read-only:bg-muted read-only:text-muted-foreground md:text-[15px]",
              inputClassName
            )}
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
