"use client"

import {
  FileTextIcon,
  Loader2Icon,
  PaperclipIcon,
  SendIcon,
  XIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { ProtectedImage } from "@/components/protected-image"
import { openProtectedFile } from "@/lib/api/protected-file"
import { useFormat } from "@/lib/i18n/use-labels"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { chatApi, useListMessagesQuery } from "@/service/chat.service"
import { useChat } from "@/socket/use-chat"
import type { ChatAttachment, ChatMessage, Conversation } from "@/types/api"
import { sameDay } from "@/util/dates"

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export function ChatThread({
  conversation,
  selfId,
  otherName,
}: {
  conversation: Conversation
  selfId: string
  otherName: string
}) {
  const t = useTranslations("chat")
  const tc = useTranslations("common")
  const format = useFormat()
  const errorText = useErrorText()
  const dispatch = useAppDispatch()
  const chat = useChat(selfId)
  const [before, setBefore] = useState<string | undefined>(undefined)
  const [older, setOlder] = useState<ChatMessage[]>([])
  const { data: page, isLoading } = useListMessagesQuery({
    conversationId: conversation._id,
    limit: 30,
  })
  const { data: olderPage, isFetching: loadingOlder } = useListMessagesQuery(
    { conversationId: conversation._id, before, limit: 30 },
    { skip: !before }
  )
  const live = useAppSelector(
    (state) => state.chat.liveMessages[conversation._id]
  )
  const pending = useAppSelector((state) => state.chat.pending)
  const typing = useAppSelector((state) => state.chat.typing[conversation._id])
  const status = useAppSelector((state) => state.chat.status)
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLLIElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)
  const otherId =
    conversation.doctor._id === selfId
      ? conversation.patient._id
      : conversation.doctor._id

  if (
    olderPage &&
    before &&
    !older.some((message) => message._id === olderPage.docs[0]?._id)
  ) {
    setOlder([...olderPage.docs, ...older])
  }

  const messages = useMemo(() => {
    const map = new Map<string, ChatMessage>()
    for (const message of [...older, ...(page?.docs ?? []), ...(live ?? [])])
      map.set(message._id, message)
    const queued = Object.values(pending).filter(
      (message) => message.conversation === conversation._id
    )
    return [...map.values(), ...queued].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  }, [conversation._id, live, older, page, pending])

  const nextBefore = before ? olderPage?.nextBefore : page?.nextBefore
  const lastIncoming = [...messages]
    .reverse()
    .find((message) => message.sender !== selfId && !message.clientId)

  const { join, leave } = chat
  useEffect(() => {
    void join(conversation._id).catch(() => undefined)
    return () => {
      void leave(conversation._id).catch(() => undefined)
    }
  }, [conversation._id, join, leave])

  useEffect(() => {
    if (!lastIncoming || lastIncoming.readBy.includes(selfId)) return
    chat.markRead(conversation._id, lastIncoming._id)
    dispatch(
      chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }])
    )
  }, [chat, conversation._id, dispatch, lastIncoming, selfId])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages.length, typing?.length])

  const onType = (value: string) => {
    setText(value)
    chat.setTyping(conversation._id, true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(
      () => chat.setTyping(conversation._id, false),
      2_000
    )
  }

  const addFiles = (list: FileList | null) => {
    const accepted = Array.from(list ?? []).filter(
      (file) => TYPES.includes(file.type) && file.size <= MAX_BYTES
    )
    if (accepted.length < (list?.length ?? 0)) toast.error(t("attachmentLimit"))
    setFiles((current) => [...current, ...accepted].slice(0, 5))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const message = text.trim()
    if (!message && files.length === 0) return
    setSending(true)
    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await file.arrayBuffer(),
        }))
      )
      setText("")
      setFiles([])
      window.clearTimeout(typingTimer.current)
      chat.setTyping(conversation._id, false)
      await chat.send({
        conversationId: conversation._id,
        message: message || undefined,
        attachments: attachments.length ? attachments : undefined,
      })
      dispatch(
        chatApi.util.invalidateTags([{ type: "Conversation", id: "LIST" }])
      )
    } catch (caught) {
      toast.error(errorText(caught))
      setText(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {status !== "connected" && status !== "idle" && (
        <p
          role="status"
          className="border-b border-warning/30 bg-warning-soft px-5 py-2 text-xs text-warning"
        >
          {t(
            `connection.${status === "connecting" ? "connecting" : status === "error" ? "error" : "disconnected"}`
          )}
        </p>
      )}
      <ol
        aria-label={t("messages")}
        aria-live="polite"
        className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface px-4 py-5 sm:px-5"
      >
        {nextBefore && (
          <li className="self-center">
            <button
              type="button"
              disabled={loadingOlder}
              onClick={() => setBefore(nextBefore)}
              className="min-h-8 border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              {t("loadEarlier")}
            </button>
          </li>
        )}
        {isLoading && (
          <li className="self-center">
            <Loader2Icon
              className="size-5 animate-spin text-subtle"
              aria-label={tc("loading")}
            />
          </li>
        )}
        {messages.map((message, index) => {
          const mine = message.sender === selfId
          const previous = messages[index - 1]
          const showDay =
            !previous || !sameDay(previous.createdAt, message.createdAt)
          const isPending = Boolean(
            message.clientId && pending[message.clientId]
          )
          const read = mine && message.readBy.includes(otherId)
          return (
            <MessageItem
              key={message._id}
              message={message}
              mine={mine}
              day={
                showDay
                  ? sameDay(message.createdAt, new Date())
                    ? tc("today")
                    : format.date(message.createdAt)
                  : null
              }
              meta={[
                format.time(message.createdAt),
                isPending ? t("sending") : read ? t("read") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )
        })}
        {typing?.some((id) => id !== selfId) && (
          <li className="self-start text-xs text-subtle">
            {t("typing", { name: otherName })}
          </li>
        )}
        <li ref={bottom} aria-hidden="true" />
      </ol>
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:px-5"
      >
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 border border-border bg-surface ps-2.5 text-xs"
              >
                <span className="max-w-40 truncate" dir="auto">
                  {file.name}
                </span>
                <button
                  type="button"
                  aria-label={t("removeAttachment", { name: file.name })}
                  onClick={() =>
                    setFiles(files.filter((_, at) => at !== index))
                  }
                  className="inline-flex size-7 items-center justify-center hover:text-danger"
                >
                  <XIcon className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("attach")}
            title={t("attach")}
            onClick={() => fileInput.current?.click()}
            className="inline-flex size-[42px] shrink-0 items-center justify-center border border-border hover:bg-muted"
          >
            <PaperclipIcon className="size-4" aria-hidden="true" />
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              addFiles(event.target.files)
              event.target.value = ""
            }}
          />
          <label htmlFor="chat-message" className="sr-only">
            {t("message")}
          </label>
          <input
            id="chat-message"
            type="text"
            value={text}
            maxLength={4000}
            autoComplete="off"
            dir="auto"
            placeholder={t("placeholder")}
            onChange={(event) => onType(event.target.value)}
            className="h-[42px] min-w-0 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && files.length === 0)}
            className="inline-flex h-[42px] shrink-0 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <SendIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            <span className="max-sm:sr-only">{t("send")}</span>
          </button>
        </div>
      </form>
    </>
  )
}

function MessageItem({
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
