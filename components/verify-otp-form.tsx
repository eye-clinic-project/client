"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function VerifyOtpForm() {
  const [code, setCode] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
        <form onSubmit={handleSubmit} onChange={() => setFeedback(null)}>
          <div className="flex flex-col items-center gap-6">
            <InputOTP
              aria-label="6-digit verification code"
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={(value) => {
                setCode(value)
                setFeedback(null)
              }}
              required
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
            <Button className="h-10 w-full" type="submit" disabled={code.length !== 6}>
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
