"use client"

/**
 * Settings → Profile: name, city and profile photo.
 * After a change the session profile is reloaded so the sidebar/avatar update everywhere.
 */

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common/user-avatar"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Panel } from "@/components/page/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useErrorText } from "@/lib/i18n/use-error-text"
import {
  useRemoveAvatarMutation,
  useUpdateMeMutation,
  useUploadAvatarMutation,
} from "@/services/user.service"
import type { User } from "@/types/api"
import {
  AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  profileSchema,
} from "@/validation/settings.schema"

export function ProfileSection({ me }: { me: User }) {
  const t = useTranslations("settings.profile")
  const tc = useTranslations("common")
  const tv = useTranslations("validation")
  const errorText = useErrorText()
  const router = useRouter()
  const { update } = useSession()
  const [updateMe] = useUpdateMeMutation()
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation()
  const [removeAvatar, { isLoading: removing }] = useRemoveAvatarMutation()
  const fileInput = useRef<HTMLInputElement>(null)
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: me.name, city: me.city },
  })

  // Refresh the profile cached in the session cookie, then re-render server components.
  const reload = async () => {
    await update({ kind: "reload-profile" })
    router.refresh()
  }

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      await updateMe(body).unwrap()
      form.reset(body)
      await reload()
      toast.success(t("saved"))
    } catch (caught) {
      toast.error(errorText(caught))
    }
  })

  // Avatar upload: type/size are checked here because it's not a Zod form.
  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) return toast.error(tv("avatarType"))
    if (file.size > MAX_AVATAR_BYTES)
      return toast.error(tv("fileTooLarge", { max: 5 }))
    const body = new FormData()
    body.set("avatar", file)
    try {
      await uploadAvatar(body).unwrap()
      await reload()
      toast.success(t("uploaded"))
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }

  return (
    <Panel id="profile" title={t("title")} bodyClassName="gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          name={me.name}
          src={me.avatarUrl}
          className="size-16 text-lg"
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-subtle">{t("photoHint")}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="h-9 rounded-none px-3 text-[13px]"
            >
              {t("upload")}
            </Button>
            {me.avatarUrl && (
              <Button
                variant="ghost"
                disabled={removing}
                onClick={async () => {
                  try {
                    await removeAvatar().unwrap()
                    await reload()
                    toast.success(t("removed"))
                  } catch (caught) {
                    toast.error(errorText(caught))
                  }
                }}
                className="h-9 rounded-none px-3 text-[13px] text-danger hover:text-danger"
              >
                {t("remove")}
              </Button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-label={t("upload")}
            onChange={(event) => {
              void onFile(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </div>
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="name"
            label={t("name")}
            autoComplete="name"
          />
          <TextField
            control={form.control}
            name="city"
            label={t("city")}
            autoComplete="address-level2"
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("email")}
          <Input
            value={me.email}
            readOnly
            dir="ltr"
            className="h-12 rounded-none bg-muted px-3.5 text-[15px] text-muted-foreground md:text-[15px]"
          />
          <span className="text-xs font-normal text-subtle">
            {t("emailHint")}
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!form.formState.isDirty}
            onClick={() => form.reset()}
            className="h-11 rounded-none px-4"
          >
            {tc("discard")}
          </Button>
          <SubmitButton
            pending={form.formState.isSubmitting}
            disabled={!form.formState.isDirty}
            className="h-11 w-auto px-5 text-sm"
          >
            {tc("saveChanges")}
          </SubmitButton>
        </div>
      </form>
    </Panel>
  )
}
