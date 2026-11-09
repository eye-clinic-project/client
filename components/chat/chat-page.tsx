"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, SendHorizontal } from "lucide-react"

import { Alert, Avatar, ButtonLink, EmptyState, RateLimitNotice, Spinner, controlClass } from "@/components/rc/ui"
import { useApi, useCooldown } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import { errorMessage, RateLimitError } from "@/service/api-client"
import { chatService } from "@/service/chat.service"
import type { Conversation, Message } from "@/lib/api-types"
import { doctorName, fmtDate, fmtRelative, fmtTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const POLL_MS = 5000

export function ChatPage({ role }: { role: "doctor" | "patient" }) {
  const params = useSearchParams()
  const router = useRouter()
  const base = role === "doctor" ? "/doctor/messages" : "/patient/messages"
  const selectedId = params.get("c")
  const withUser = params.get("with")
  const list = useApi(() => chatService.list(), [])
  const [startError, setStartError] = useState<string | null>(null)

  // ?with=<userId> opens (or creates) the conversation with that person.
  useEffect(() => {
    if (!withUser) return
    chatService
      .start(withUser)
      .then((c) => {
        void list.reload()
        router.replace(`${base}?c=${c.id}`)
      })
      .catch((err) => setStartError(errorMessage(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUser])

  const conversations = list.data ?? []
  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const showName = (c: Conversation) => (role === "patient" ? doctorName(c.participant?.name) : c.participant?.name)

  return (
    <div className="flex h-[calc(100svh-9rem)] min-h-[520px] overflow-hidden rounded-2xl border bg-card">
      <aside
        aria-label="Conversations"
        className={cn("flex w-full flex-col border-r md:w-[320px] md:shrink-0", selected && "hidden md:flex")}
      >
        <h1 className="px-5 pt-5 pb-3 font-heading text-2xl font-semibold">Messages</h1>
        {startError && <Alert className="mx-4 mb-3">{startError}</Alert>}
        {list.error ? <Alert className="mx-4">{errorMessage(list.error)}</Alert> : null}
        <div className="flex-1 overflow-y-auto">
          {list.loading && !list.data && <Spinner />}
          {list.data && conversations.length === 0 && (
            <EmptyState title="No conversations yet">
              {role === "patient"
                ? "You can message a doctor who follows you."
                : "Open a patient's analysis and choose Message patient."}
            </EmptyState>
          )}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`${base}?c=${c.id}`}
              aria-current={c.id === selectedId ? "true" : undefined}
              className={cn(
                "flex items-center gap-3 border-t px-5 py-3.5 first:border-t-0 hover:bg-muted",
                c.id === selectedId && "bg-accent hover:bg-accent",
              )}
            >
              <Avatar name={c.participant?.name ?? "?"} src={c.participant?.avatarUrl} size={44} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{showName(c)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtRelative(c.lastMessageAt)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm text-muted-foreground">{c.lastMessage?.message || "No messages yet"}</span>
                  {c.unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                      {c.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </aside>

      {selected ? (
        <Thread
          key={selected.id}
          conversation={selected}
          title={showName(selected) ?? ""}
          role={role}
          backHref={base}
          onActivity={() => void list.reload()}
        />
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <EmptyState title="Choose a conversation" />
        </div>
      )}
    </div>
  )
}

function Thread({
  conversation,
  title,
  role,
  backHref,
  onActivity,
}: {
  conversation: Conversation
  title: string
  role: "doctor" | "patient"
  backHref: string
  onActivity: () => void
}) {
  const { me } = useSession()
  const cooldown = useCooldown()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLLIElement>(null)
  const lastId = useRef<string | null>(null)
  const activity = useRef(onActivity)
  useEffect(() => {
    activity.current = onActivity
  }, [onActivity])

  const load = useCallback(async () => {
    try {
      const page = await chatService.messages(conversation.id)
      setMessages(page.items)
      const newest = page.items.at(-1)?.id ?? null
      if (newest !== lastId.current) {
        lastId.current = newest
        await chatService.markRead(conversation.id).catch(() => null)
        activity.current()
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [conversation.id])

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [load])

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  async function send(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError(null)
    try {
      const sent = await chatService.send(conversation.id, body)
      setMessages((prev) => [...prev, sent])
      lastId.current = sent.id
      setText("")
      onActivity()
    } catch (err) {
      cooldown.trip(err)
      if (!(err instanceof RateLimitError)) setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const dayHeaders = messages.map((m, i) =>
    i === 0 || fmtDate(m.createdAt) !== fmtDate(messages[i - 1]!.createdAt) ? fmtDate(m.createdAt) : null,
  )
  return (
    <section aria-label={`Conversation with ${title}`} className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Link href={backHref} aria-label="Back to conversations" className="flex size-10 items-center justify-center rounded-[9px] hover:bg-muted md:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar name={conversation.participant?.name ?? "?"} src={conversation.participant?.avatarUrl} size={40} />
        <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
        {role === "patient" && (
          <ButtonLink href="/patient/appointments" variant="outline" size="sm">
            Book visit
          </ButtonLink>
        )}
      </div>
      <ol className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:px-6">
        {loading && <Spinner />}
        {!loading && messages.length === 0 && (
          <li className="m-auto text-sm text-muted-foreground">No messages yet. Say hello.</li>
        )}
        {messages.map((m, i) => {
          const mine = m.sender === me?.id
          const header = dayHeaders[i]
          const read = mine && m.readBy.some((id) => id !== me?.id)
          return (
            <li key={m.id} className="contents">
              {header && <span className="my-1 self-center text-xs font-medium text-muted-foreground">{header}</span>}
              <span className={cn("flex max-w-[78%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
                <span
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
                    m.deletedAt && "italic opacity-70",
                  )}
                >
                  {m.deletedAt ? "Message deleted" : m.message}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtTime(m.createdAt)}
                  {read ? " · Read" : ""}
                </span>
              </span>
            </li>
          )
        })}
        <li ref={end} aria-hidden="true" />
      </ol>
      <div className="border-t px-4 py-3 sm:px-6">
        {error && <Alert className="mb-3">{error}</Alert>}
        <RateLimitNotice remaining={cooldown.remaining} className="mb-3" />
        {conversation.canSend ? (
          <form onSubmit={send} className="flex gap-3">
            <label htmlFor="chat-message" className="sr-only">
              Message
            </label>
            <input
              id="chat-message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              autoComplete="off"
              maxLength={4000}
              className={controlClass}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={sending || !text.trim() || cooldown.active}
              className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              <SendHorizontal className="size-5" aria-hidden="true" />
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can read this conversation, but new messages need an active doctor–patient link.
          </p>
        )}
      </div>
    </section>
  )
}
