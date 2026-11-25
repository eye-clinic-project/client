"use client"

/**
 * Settings → Security:
 * - Change password: emails a code, then a dialog takes code + new password.
 * - Sign out everywhere: revokes all sessions on all devices.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormAlert } from "@/components/form/form-alert"
import { OtpField } from "@/components/form/otp-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { ConfirmDialog } from "@/components/page/confirm-dialog"
import { Panel } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSignOut } from "@/hooks/use-sign-out"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/services/auth.service"
import { passwordChangeSchema } from "@/validation/settings.schema"

import { SettingsRow } from "./settings-row"

export function SecuritySection({ email }: { email: string }) {
  const t = useTranslations("settings.security")
  const errorText = useErrorText()
  const [forgot, { isLoading: sending }] = useForgotPasswordMutation()
  const [resetOpen, setResetOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { signOut, pending } = useSignOut()

  return (
    <Panel id="security" title={t("title")} bodyClassName="py-1">
      <SettingsRow title={t("password")} hint={t("passwordHint")}>
        <Button
          variant="outline"
          disabled={sending}
          onClick={async () => {
            try {
              await forgot({ email }).unwrap()
              toast.success(t("codeSent"))
              setResetOpen(true)
            } catch (caught) {
              toast.error(errorText(caught))
            }
          }}
          className="h-10 rounded-none px-4"
        >
          {t("reset")}
        </Button>
      </SettingsRow>
      <SettingsRow title={t("everywhere")} hint={t("everywhereHint")}>
        <Button
          variant="outline"
          onClick={() => setConfirming(true)}
          className="h-10 rounded-none px-4 text-danger hover:text-danger"
        >
          {t("everywhereButton")}
        </Button>
      </SettingsRow>
      {resetOpen && (
        <ResetPasswordDialog
          email={email}
          onClose={() => setResetOpen(false)}
        />
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("everywhereTitle")}
        description={t("everywhereBody")}
        confirmLabel={t("everywhereButton")}
        destructive
        pending={pending}
        onConfirm={() => void signOut({ everywhere: true })}
      />
    </Panel>
  )
}

/** Second step of the password change: code from the email + new password. */
function ResetPasswordDialog({
  email,
  onClose,
}: {
  email: string
  onClose: () => void
}) {
  const t = useTranslations("settings.security")
  const ta = useTranslations("auth")
  const errorText = useErrorText()
  const [reset] = useResetPasswordMutation()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  })

  const onSubmit = form.handleSubmit(async ({ code, password }) => {
    setError(null)
    try {
      await reset({ email, code, password }).unwrap()
      toast.success(t("updated"))
      onClose()
    } catch (caught) {
      setError(errorText(caught))
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-5 rounded-none p-6 text-sm sm:max-w-md">
        <DialogHeader className="gap-2 text-start">
          <DialogTitle className="text-lg font-semibold">
            {t("resetTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("resetLead", { email })}
          </DialogDescription>
        </DialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <OtpField control={form.control} name="code" />
          <TextField
            control={form.control}
            name="password"
            label={ta("fields.newPassword")}
            type="password"
            autoComplete="new-password"
            description={ta("fields.passwordHint")}
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label={ta("fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
          <SubmitButton pending={form.formState.isSubmitting}>
            {ta("reset.submit")}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
