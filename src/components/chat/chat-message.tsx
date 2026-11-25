"use client"

import { FileTextIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { ProtectedImage } from "@/components/common/protected-image"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import type { ChatAttachment, ChatMessage } from "@/types/api"

/** One chat bubble (attachments, text, `meta` line), preceded by a day divider when `day` is set. */
export function MessageItem({
  message,
  mine,
  day,
  meta,
}: {
  message: ChatMessage
  mine: boolean
  day: string | null
  meta: string
}) {
  return (
    <>
      {day && (
        <li className="self-center bg-muted px-2.5 py-1 text-xs text-subtle">
          {day}
        </li>
      )}
      <li
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          mine ? "items-end self-end" : "items-start self-start"
        )}
      >
        {message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((attachment) => (
              <AttachmentView key={attachment.index} attachment={attachment} />
            ))}
          </div>
        )}
        {message.message && (
          <div
            dir="auto"
            className={cn(
              "px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
              mine
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
            )}
          >
            {message.message}
          </div>
        )}
        <span className="text-[11px] text-subtle">{meta}</span>
      </li>
    </>
  )
}

/** An attachment: image thumbnail or file button; both open the protected file in a new tab. */
function AttachmentView({ attachment }: { attachment: ChatAttachment }) {
  const t = useTranslations("chat")
  const errorText = useErrorText()
  const open = () =>
    openProtectedFile(attachment.url).catch((caught: unknown) =>
      toast.error(errorText(caught))
    )
  if (attachment.isImage) {
    return (
      <button
        type="button"
        onClick={() => void open()}
        aria-label={t("openAttachment", { index: attachment.index + 1 })}
        className="border border-border bg-card"
      >
        <ProtectedImage
          path={attachment.url}
          alt={t("attachment")}
          className="h-36 w-48 object-cover"
        />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => void open()}
      className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
    >
      <FileTextIcon className="size-4 text-brand" aria-hidden="true" />
      {t("openAttachment", { index: attachment.index + 1 })}
    </button>
  )
}
