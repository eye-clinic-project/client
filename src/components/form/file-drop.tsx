"use client"

import { FileIcon, ImageIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useRef, useState, type DragEvent } from "react"

import { cn } from "@/lib/utils"
import { formatBytes } from "@/util/format"

interface FileDropProps {
  files: File[]
  onChange: (files: File[]) => void
  accept: string
  max: number
  label: string
  title?: string
  hint: string
  invalid?: boolean
  className?: string
}

export function FileDrop({
  files,
  onChange,
  accept,
  max,
  label,
  title,
  hint,
  invalid,
  className,
}: FileDropProps) {
  const t = useTranslations("auth.files")
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const full = files.length >= max

  const add = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const next = max === 1 ? [incoming[0]] : [...files, ...Array.from(incoming)]
    onChange(next.slice(0, max))
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    add(event.dataTransfer.files)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span id={`${id}-label`} className="text-sm font-medium">
        {label}
      </span>
      {(!full || max === 1) && (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 border border-dashed px-4 py-6 text-center",
            dragging
              ? "border-brand bg-brand-soft"
              : invalid
                ? "border-destructive bg-background"
                : "border-border bg-background hover:border-brand"
          )}
        >
          <UploadCloudIcon className="size-6 text-brand" aria-hidden="true" />
          <span className="text-sm font-semibold">{title ?? t("drop")}</span>
          <span className="text-xs text-subtle">{hint}</span>
          <input
            ref={input}
            id={id}
            type="file"
            accept={accept}
            multiple={max > 1}
            aria-labelledby={`${id}-label`}
            aria-invalid={invalid}
            className="sr-only"
            onChange={(event) => {
              add(event.target.files)
              event.target.value = ""
            }}
          />
        </label>
      )}
      {files.length > 0 && (
        <ul className="flex flex-col border border-b-0 border-border">
          {files.map((file, index) => {
            const Icon = file.type.startsWith("image/") ? ImageIcon : FileIcon
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 border-b border-border bg-background px-3 py-2.5"
              >
                <Icon
                  className="size-4 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium" dir="auto">
                    {file.name}
                  </span>
                  <span className="text-xs text-subtle">
                    {file.type.split("/")[1]?.toUpperCase()} ·{" "}
                    {formatBytes(file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={t("removeFile", { name: file.name })}
                  onClick={() =>
                    onChange(files.filter((_, at) => at !== index))
                  }
                  className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
