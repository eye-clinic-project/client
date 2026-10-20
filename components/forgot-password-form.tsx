"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth"

export function ForgotPasswordForm() {
  const [feedback, setFeedback] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  function onSubmit() {
    setFeedback(
      "Password recovery is not configured yet. No email has been sent."
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md border-border/70 shadow-xl shadow-foreground/5">
      <CardHeader className="gap-3 px-6 pt-8 text-center sm:px-8">
        <div
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Mail className="size-5" />
        </div>
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription className="text-pretty">
          Enter the email address associated with your account and we’ll help
          you get back in.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-8">
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setFeedback(null)}
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
              <FieldDescription>
                We won’t send anything until password recovery is connected.
              </FieldDescription>
            </Field>
            <Field>
              <Button className="h-10" type="submit">
                Continue
              </Button>
              {feedback && (
                <p className="text-center text-sm text-muted-foreground" role="status">
                  {feedback}
                </p>
              )}
            </Field>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-4" />
                Back to sign in
              </Link>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
