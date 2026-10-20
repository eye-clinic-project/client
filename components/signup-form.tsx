"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import Link from "next/link"
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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signupSchema, type SignupFormValues } from "@/lib/validation/auth"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [feedback, setFeedback] = useState<{
    message: string
    isError: boolean
  } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  function onSubmit() {
    setFeedback({
      message: "Account creation is not configured yet. Your details were not sent.",
      isError: false,
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader className="gap-2 px-6 pt-8 text-center sm:px-8">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription className="text-pretty">
            Enter your email below to create your account
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
                  placeholder="m@example.com"
                  className="h-10"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError>{errors.email?.message}</FieldError>
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
              </Field>
              <Field>
                <Field className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      className="h-10"
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <FieldError>{errors.password?.message}</FieldError>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="h-10"
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                      {...register("confirmPassword")}
                    />
                    <FieldError>
                      {errors.confirmPassword?.message}
                    </FieldError>
                  </Field>
                </Field>
                <FieldDescription>
                  Use a password with at least 8 characters.
                </FieldDescription>
              </Field>
              <Field>
                <Button className="h-10" type="submit">
                  Create Account
                </Button>
              </Field>
              {feedback && (
                <p
                  className={
                    feedback.isError
                      ? "text-center text-sm text-destructive"
                      : "text-center text-sm text-muted-foreground"
                  }
                  role={feedback.isError ? "alert" : "status"}
                >
                  {feedback.message}
                </p>
              )}
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field className="grid gap-4">

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() =>
                    setFeedback({
                      message: "Google sign-up is not configured yet.",
                      isError: false,
                    })
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Sign up with Google</span>
                </Button>

              </Field>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-foreground">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-4 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
