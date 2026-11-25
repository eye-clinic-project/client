/**
 * Public auth endpoints called from the client (no session needed):
 * sign-up, email verification and password reset.
 * Sign-in itself goes through Auth.js (auth.ts), not through here.
 */

import { defineMutation } from "@/lib/query/define"
import type {
  EmailPayload,
  ResetPasswordPayload,
  SignUpPayload,
  VerifyEmailPayload,
} from "@/validation/auth.schema"

export const useSignUpMutation = defineMutation<unknown, SignUpPayload>({
  query: (body) => ({
    url: "/authentication/sign-up",
    method: "POST",
    body,
  }),
})

export const useSendVerificationEmailMutation = defineMutation<
  void,
  EmailPayload
>({
  query: (body) => ({
    url: "/authentication/verify-email/send",
    method: "POST",
    body,
  }),
})

export const useVerifyEmailMutation = defineMutation<void, VerifyEmailPayload>({
  query: (body) => ({
    url: "/authentication/verify-email",
    method: "POST",
    body,
  }),
})

export const useForgotPasswordMutation = defineMutation<void, EmailPayload>({
  query: (body) => ({
    url: "/authentication/forgot-password",
    method: "POST",
    body,
  }),
})

export const useResetPasswordMutation = defineMutation<
  void,
  ResetPasswordPayload
>({
  query: (body) => ({
    url: "/authentication/reset-password",
    method: "POST",
    body,
  }),
})
