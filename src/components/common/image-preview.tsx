"use client"

/** Preview of a local File (before upload). The object URL is revoked when the image unmounts or the file changes. */

import { useCallback } from "react"

import { cn } from "@/lib/utils"

export function ImagePreview({
  file,
  alt,
  className,
}: {
  file: File
  alt: string
  className?: string
}) {
  // Callback ref with cleanup (React 19): runs when the <img> mounts, cleanup on unmount.
  const attach = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return
      const url = URL.createObjectURL(file)
      image.src = url
      return () => URL.revokeObjectURL(url)
    },
    [file]
  )
  return (
    <img ref={attach} alt={alt} className={cn("object-contain", className)} />
  )
}
