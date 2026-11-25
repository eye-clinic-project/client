"use client"

/**
 * "Continue with Google" button. Starts the Auth.js Google flow; the backend
 * exchange happens in auth.ts. Only rendered when Google is configured (googleEnabled).
 */

import { Loader2Icon } from "lucide-react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth")
  const [pending, setPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void signIn("google", { redirectTo: callbackUrl ?? "/" })
      }}
      className="h-12 w-full gap-2.5 rounded-none bg-background text-[15px] font-medium"
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z"
          />
          <path
            fill="#34A853"
            d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.1H2A11 11 0 0 0 1 12c0 1.8.4 3.4 1.2 4.9z"
          />
          <path
            fill="#EA4335"
            d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6z"
          />
        </svg>
      )}
      {t("google")}
    </Button>
  )
}
