"use client"

/** <img> for files that need the access token (scans, Grad-CAM, license images). Shows loading/error states. */

import { ImageOffIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useProtectedFile } from "@/hooks/use-protected-file"
import { cn } from "@/lib/utils"

export function ProtectedImage({
  path,
  alt,
  className,
  fallback,
}: {
  path: string | null
  alt: string
  className?: string
  fallback?: string
}) {
  const file = useProtectedFile(path)
  if (file.status === "ready") {
    return (
      <img
        src={file.url}
        alt={alt}
        className={cn("object-contain", className)}
      />
    )
  }
  if (file.status === "error" || !path) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-muted text-xs text-subtle",
          className
        )}
      >
        <ImageOffIcon className="size-6" aria-hidden="true" />
        {fallback}
      </div>
    )
  }
  return <Skeleton className={cn("rounded-none", className)} />
}
