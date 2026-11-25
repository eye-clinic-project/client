"use client"

import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"
import { useProtectedFile } from "@/hooks/use-protected-file"

export function PdfPreview({
  path,
  title,
  emptyText,
  errorText,
}: {
  path: string | null
  title: string
  emptyText: string
  errorText: string
}) {
  const tc = useTranslations("common")
  const file = useProtectedFile(path)
  if (!path)
    return (
      <p className="flex aspect-[1/1.3] items-center justify-center bg-muted p-6 text-center text-sm text-subtle">
        {emptyText}
      </p>
    )
  if (file.status === "error")
    return (
      <p className="flex aspect-[1/1.3] items-center justify-center bg-muted p-6 text-center text-sm text-subtle">
        {errorText}
      </p>
    )
  if (file.status !== "ready")
    return (
      <Skeleton className="aspect-[1/1.3] w-full rounded-none">
        <span className="sr-only">{tc("loading")}</span>
      </Skeleton>
    )
  return (
    <iframe
      src={file.url}
      title={title}
      className="aspect-[1/1.3] w-full border border-border bg-white"
    />
  )
}
