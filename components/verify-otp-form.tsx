"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  verifyOtpSchema,
  type VerifyOtpFormValues,
} from "@/lib/validation/auth"

export function VerifyOtpForm() {
  const [feedback, setFeedback] = useState<string | null>(null)
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  })

  function onSubmit() {
    setFeedback("Code verification is not configured yet. The code was not checked.")
  }

  return (
    <Card className="mx-auto w-full max-w-md border-border/70 shadow-xl shadow-foreground/5">
      <CardHeader className="gap-3 px-6 pt-8 text-center sm:px-8">
        <div
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription className="text-pretty">
          Enter the 6-digit verification code from your email. Code verification
          isn’t connected yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-8">
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setFeedback(null)}
        >
          <div className="flex flex-col items-center gap-6">
            <Controller
              control={control}
              name="code"
              render={({ field }) => (
                <InputOTP
                  aria-label="6-digit verification code"
                  aria-invalid={!!errors.code}
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(value) => {
                    field.onChange(value)
                    setFeedback(null)
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="size-11 text-base sm:size-12"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            <FieldError className="text-center">
              {errors.code?.message}
            </FieldError>
            <Button className="h-10 w-full" type="submit">
              Verify code
            </Button>
            {feedback && (
              <p className="text-center text-sm text-muted-foreground" role="status">
                {feedback}
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Didn’t receive a code?{" "}
              <button
                className="font-medium text-foreground underline underline-offset-4"
                type="button"
                onClick={() =>
                  setFeedback("Code delivery is not configured yet. No code was sent.")
                }
              >
                Resend code
              </button>
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to password recovery
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
