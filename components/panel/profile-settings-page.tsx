"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Camera, LockKeyhole, Save, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useProfile } from "@/components/panel/use-profile"
import { profileUpdated } from "@/lib/redux/features/workspace/workspaceSlice"
import { useAppDispatch } from "@/lib/redux/hooks"
import { profileStorageKey, type ProfileRole } from "@/lib/profile-settings"
import {
  passwordSettingsSchema,
  profileSettingsSchema,
  type PasswordSettingsValues,
  type ProfileSettingsValues,
} from "@/lib/validation/settings"

const maxAvatarSize = 2 * 1024 * 1024

export function ProfileSettingsPage({
  role,
}: {
  role: ProfileRole
}) {

  const profile = useProfile(role)
  
  const dispatch = useAppDispatch()

  const [avatar, setAvatar] = useState<string | null>(null)
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register: registerProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    values: profile,
  })

  const {
    register: registerPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordSettingsValues>({
    resolver: zodResolver(passwordSettingsSchema),
  })

  function saveProfile(values: ProfileSettingsValues) {
    setProfileFeedback(null)
    setProfileError(null)

    const updatedProfile = {
      ...values,
      avatar: avatar ?? profile.avatar,
    }

    try {
      window.localStorage.setItem(
        profileStorageKey(role),
        JSON.stringify(updatedProfile)
      )
      dispatch(profileUpdated({ role, profile: updatedProfile }))
      setProfileFeedback(
        "Profile updated on this device. It is not synced to an account."
      )
    } catch {
      setProfileError(
        "Couldn’t save this profile in browser storage. Try a smaller image."
      )
    }
  }

  function savePassword() {
    setPasswordFeedback(
      "Password updates are not connected to an account yet. No password was changed or stored."
    )
    resetPassword()
  }

  function handleAvatarChange(file?: File) {
    setAvatarError(null)
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > maxAvatarSize) {
      setAvatarError("Image must be 2 MB or smaller.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setAvatarError("Couldn’t preview that image. Choose another file.")
        return
      }
      setAvatar(reader.result)
      setProfileFeedback(null)
    }
    reader.onerror = () => {
      setAvatarError("Couldn’t read that image. Choose another file.")
    }
    reader.readAsDataURL(file)
  }

  const visibleAvatar = avatar ?? profile.avatar
  const roleName = role === "doctor" ? "doctor" : "patient"

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your {roleName} profile and security preferences.
        </p>
      </header>

      <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        Profile changes are saved only in this browser for the prototype.
        Password changes require a connected authentication service.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            Profile information
          </CardTitle>
          <CardDescription>
            Update the name and email shown in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="space-y-6"
            onSubmit={submitProfile(saveProfile)}
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border bg-primary/10 text-lg font-semibold text-primary">
                {visibleAvatar ? (
                  <Image
                    src={visibleAvatar}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  profileInitials(profile.name)
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    handleAvatarChange(event.currentTarget.files?.[0])
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Update photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP · up to 2 MB
                </p>
                {avatarError && (
                  <p className="text-sm text-destructive" role="alert">
                    {avatarError}
                  </p>
                )}
              </div>
            </div>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                <Input
                  id="profile-name"
                  autoComplete="name"
                  aria-invalid={!!profileErrors.name}
                  {...registerProfile("name")}
                />
                <FieldError>{profileErrors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-email">Email address</FieldLabel>
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!profileErrors.email}
                  {...registerProfile("email")}
                />
                <FieldError>{profileErrors.email?.message}</FieldError>
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              <Button type="submit" className="gap-2" disabled={profileSubmitting}>
                <Save className="size-4" />
                Save profile
              </Button>
              {profileFeedback && (
                <p className="text-sm text-muted-foreground" role="status">
                  {profileFeedback}
                </p>
              )}
              {profileError && (
                <p className="text-sm text-destructive" role="alert">
                  {profileError}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-primary" />
            Change password
          </CardTitle>
          <CardDescription>
            Choose a new password of at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="space-y-5"
            onSubmit={submitPassword(savePassword)}
          >
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="current-password">
                  Current password
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!passwordErrors.currentPassword}
                  {...registerPassword("currentPassword")}
                />
                <FieldError>
                  {passwordErrors.currentPassword?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!passwordErrors.newPassword}
                  {...registerPassword("newPassword")}
                />
                <FieldError>{passwordErrors.newPassword?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!passwordErrors.confirmPassword}
                  {...registerPassword("confirmPassword")}
                />
                <FieldError>
                  {passwordErrors.confirmPassword?.message}
                </FieldError>
              </Field>
            </FieldGroup>
            <div className="space-y-3">
              <Button type="submit" variant="outline">
                Update password
              </Button>
              {passwordFeedback && (
                <p className="text-sm text-muted-foreground" role="status">
                  {passwordFeedback}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function profileInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
