"use client"

/** Yes/No confirmation dialog for destructive or important actions (delete, sign out everywhere…). */

import { Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
  destructive,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  pending?: boolean
  destructive?: boolean
  children?: ReactNode
}) {
  const t = useTranslations("common")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-none p-6 text-sm sm:max-w-md">
        <DialogHeader className="gap-2 text-start">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-none px-4"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
            className="h-10 rounded-none px-4"
          >
            {pending && (
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
