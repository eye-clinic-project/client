import type {
  EmailPayload,
  ResetPasswordPayload,
  SignUpPayload,
  VerifyEmailPayload,
} from "@/validation/auth.schema"
import { api } from "./api"

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signUp: build.mutation<unknown, SignUpPayload>({
      query: (body) => ({
        url: "/authentication/sign-up",
        method: "POST",
        body,
      }),
    }),
    sendVerificationEmail: build.mutation<void, EmailPayload>({
      query: (body) => ({
        url: "/authentication/verify-email/send",
        method: "POST",
        body,
      }),
    }),
    verifyEmail: build.mutation<void, VerifyEmailPayload>({
      query: (body) => ({
        url: "/authentication/verify-email",
        method: "POST",
        body,
      }),
    }),
    forgotPassword: build.mutation<void, EmailPayload>({
      query: (body) => ({
        url: "/authentication/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: build.mutation<void, ResetPasswordPayload>({
      query: (body) => ({
        url: "/authentication/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
})

export const {
  useSignUpMutation,
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi
