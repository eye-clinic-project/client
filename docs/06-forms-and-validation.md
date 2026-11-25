# 6. Forms & Validation

## 6.1 Stack

- **Zod v4** schemas in `validation/<domain>.schema.ts`.
- **react-hook-form** with `zodResolver`.
- Bound field components in `components/form/`: `TextField`, `TextareaField`,
  `SelectField`, `OtpField`, `FileDrop`, `SubmitButton`, `FormAlert`,
  `FormFieldError`.

## 6.2 Translated validation messages — the `vm()` trick

Zod messages are not translated directly. Schemas store a **key** (plus values)
using `vm()`:

```ts
import { vm } from "@/lib/i18n/validation"
z.string().max(254, vm("tooLong", { max: 254 }))   // → 'tooLong|{"max":254}'
```

`FormFieldError` uses `useValidationMessage()` to parse it and look it up in
`i18n/messages/<lang>/validation.json`. If the key is missing it shows the raw string,
so a missing translation is visible during development.

**Rule:** never write English text in a schema; add a key to both
`i18n/messages/en/validation.json` and `i18n/messages/ar/validation.json`.

## 6.3 Shared building blocks — `validation/common.schema.ts`

`email`, `newPassword` (8–72), `requiredText(max)`, `optionalText(max)`, `otp`
(6 digits), `licenseDocuments` (1–3 files, PDF/JPEG/PNG/WEBP, ≤10 MB),
`blankToUndefined`. Reuse these before writing new rules.

## 6.4 Schemas that produce the request body

Schemas may `.transform()` form values into exactly what the API expects. Then
the form is typed with three generics — input, context, output:

```ts
const form = useForm<CreateAnalysisInput, unknown, FormData>({
  resolver: zodResolver(createAnalysisSchema),
  defaultValues: { patientId, eye: "left", capturedAt: "", notes: "", image: [] },
})
const onSubmit = form.handleSubmit(async (body) => {   // body is FormData
  setError(null)
  try {
    await createAnalysis(body).unwrap()
    toast.success(t("queued"))
    router.push("/doctor/analyses")
  } catch (caught) {
    setError(errorText(caught))
  }
})
```

Examples: `createAnalysisSchema` builds `FormData`; `reviewSchema` turns `null`
selections into required-field errors with `superRefine` and converts dates to ISO.

Export `z.input<typeof schema>` as `XxxInput` for `useForm` and default values.

## 6.5 Form checklist

- Default values for every field (controlled inputs, no `undefined` warnings).
- Show server errors in a `FormAlert` using `useErrorText()`.
- Disable/indicate submit with `SubmitButton pending={form.formState.isSubmitting}`.
- Success → `toast.success(t(...))` and navigate or reset.
- Dates: `<input type="date|datetime-local">` gives local strings; convert to ISO
  in the schema transform.
- Files: validate type and size in Zod; preview with `ImagePreview`/`PdfPreview`.

Next: [7. i18n, theming & UI kit →](./07-i18n-theming-ui.md)
