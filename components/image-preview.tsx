"use client"

import { useCallback } from "react"

import { cn } from "@/lib/utils"

export function ImagePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const attach = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return
      const url = URL.createObjectURL(file)
      image.src = url
      return () => URL.revokeObjectURL(url)
    },
    [file]
  )
  return <img ref={attach} alt={alt} className={cn("object-contain", className)} />
}
