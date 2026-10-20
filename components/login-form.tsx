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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit() {
    setFeedback("Sign-in is not configured yet. Your details were not sent.")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/70 shadow-xl shadow-foreground/5">
        <CardHeader className="gap-2 px-6 pt-8 text-center sm:px-8">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription className="text-pretty">
            Enter your email below to login to your account
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
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-10"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
              <Field>
                <Button className="h-10" type="submit">
                  Sign in
                </Button>
                <Button
                  className="h-10"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setFeedback("Google sign-in is not configured yet.")
                  }
                >
                  Login with Google
                </Button>
                {feedback && (
                  <p className="text-center text-sm text-muted-foreground" role="status">
                    {feedback}
                  </p>
                )}
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-medium text-foreground">
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
