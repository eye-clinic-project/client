"use client"

/**
 * Uploads license files that a doctor picked during sign-up (saved in IndexedDB,
 * see lib/license-draft.ts) right after their first sign-in. Runs once; renders nothing.
 * If the license was already submitted, the local draft is just deleted.
 */

import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { deleteLicenseDraft, readLicenseDraft } from "@/lib/license-draft"
import { useSubmitLicenseMutation } from "@/services/doctor.service"
import type { DoctorVerification } from "@/types/api"

export function LicenseDraftUploader({
  email,
  verification,
}: {
  email: string
  verification: DoctorVerification | undefined
}) {
  const t = useTranslations("shell.license")
  const [submitLicense] = useSubmitLicenseMutation()
  const started = useRef(false)

  useEffect(() => {
    if (!verification || started.current) return
    started.current = true
    const alreadySubmitted =
      verification.submittedAt !== null && verification.documents.length > 0
    void (async () => {
      const draft = await readLicenseDraft(email)
      if (!draft) return
      if (alreadySubmitted) {
        await deleteLicenseDraft(email)
        return
      }
      const body = new FormData()
      body.set("licenseNumber", draft.licenseNumber)
      for (const file of draft.documents) body.append("documents", file)
      const pending = toast.loading(t("uploading"))
      try {
        await submitLicense(body).unwrap()
        await deleteLicenseDraft(email)
        toast.success(t("uploaded"), { id: pending })
      } catch {
        toast.error(t("failed"), { id: pending })
      }
    })()
  }, [email, submitLicense, t, verification])

  return null
}
