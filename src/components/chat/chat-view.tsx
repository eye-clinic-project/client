"use client"

import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { SearchInput } from "@/components/page/search-input"
import { EmptyState, ListSkeleton } from "@/components/page/states"
import { UserAvatar } from "@/components/user-avatar"
import { useFormat } from "@/lib/i18n/use-labels"
import { cn } from "@/lib/utils"
import {
  useListConversationsQuery,
  useStartConversationMutation,
} from "@/service/chat.service"
import type { Conversation, Role } from "@/types/api"
import { ChatThread } from "./chat-thread"

function counterpart(conversation: Conversation, role: Exclude<Role, "admin">) {
  return role === "doctor" ? conversation.patient : conversation.doctor
}

export function ChatView({
  role,
  selfId,
  basePath,
  initialConversationId,
  startWithUserId,
}: {
  role: Exclude<Role, "admin">
  selfId: string
  basePath: string
  initialConversationId?: string
  startWithUserId?: string
}) {
  const t = useTranslations("chat")
  const router = useRouter()
  const { data: conversations, isLoading } = useListConversationsQuery(
    undefined,
    { pollingInterval: 60_000 }
  )
  const [startConversation] = useStartConversationMutation()
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId ?? null
  )
  const [search, setSearch] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (!startWithUserId || started.current) return
    started.current = true
    startConversation({ participantId: startWithUserId })
      .unwrap()
      .then(
        (conversation) => {
          setActiveId(conversation._id)
          router.replace(`${basePath}?c=${conversation._id}`)
        },
        () => undefined
      )
  }, [basePath, router, startConversation, startWithUserId])

  const other = (conversation: Conversation) => counterpart(conversation, role)
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = [...(conversations ?? [])].sort((a, b) =>
      (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")
    )
    return query
      ? list.filter((item) =>
          counterpart(item, role).name.toLowerCase().includes(query)
        )
      : list
  }, [conversations, search, role])
  const active = conversations?.find((item) => item._id === activeId) ?? null

  const select = (id: string | null) => {
    setActiveId(id)
    router.replace(id ? `${basePath}?c=${id}` : basePath, { scroll: false })
  }

  return (
    <div className="-mx-4 -mt-7 -mb-12 flex h-[calc(100svh-4rem)] border-border sm:-mx-10 lg:h-svh">
      <section
        aria-label={t("conversations")}
        className={cn(
          "flex w-full min-w-0 flex-col border-e border-border md:w-[320px] md:shrink-0",
          active && "max-md:hidden"
        )}
      >
        <div className="flex flex-col gap-3 border-b border-border px-4 pt-5 pb-3">
          <h1 className="text-xl font-semibold tracking-[-0.01em]">
            {t("title")}
          </h1>
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={setSearch}
          />
        </div>
        {isLoading ? (
          <ListSkeleton className="p-4" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquareIcon}
            title={search ? t("noMatches") : t("empty")}
            description={
              search
                ? undefined
                : role === "doctor"
                  ? t("emptyDoctor")
                  : t("emptyPatient")
            }
          />
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {filtered.map((conversation) => (
              <ConversationRow
                key={conversation._id}
                conversation={conversation}
                person={other(conversation)}
                selfId={selfId}
                active={conversation._id === activeId}
                onSelect={() => select(conversation._id)}
              />
            ))}
          </ul>
        )}
      </section>
      <section
        aria-label={
          active ? t("with", { name: other(active).name }) : t("messages")
        }
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          !active && "max-md:hidden"
        )}
      >
        {active ? (
          <>
            <ThreadHeader
              person={other(active)}
              role={role}
              onBack={() => select(null)}
            />
            <ChatThread
              key={active._id}
              conversation={active}
              selfId={selfId}
              otherName={other(active).name}
            />
          </>
        ) : (
          <EmptyState
            icon={MessageSquareIcon}
            title={t("pick")}
            description={t("pickHint")}
            className="my-auto"
          />
        )}
      </section>
    </div>
  )
}

function ConversationRow({
  conversation,
  person,
  selfId,
  active,
  onSelect,
}: {
  conversation: Conversation
  person: Conversation["doctor"]
  selfId: string
  active: boolean
  onSelect: () => void
}) {
  const t = useTranslations("chat")
  const format = useFormat()
  const last = conversation.lastMessage
  const preview = last ? last.message || t("attachment") : ""
  const at = conversation.lastMessageAt
  const today = at && new Date(at).toDateString() === new Date().toDateString()
  return (
    <li>
      <button
        type="button"
        aria-current={active ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-start",
          active
            ? "bg-muted shadow-[inset_2px_0_0_var(--color-brand)] rtl:shadow-[inset_-2px_0_0_var(--color-brand)]"
            : "hover:bg-surface"
        )}
      >
        <UserAvatar name={person.name} src={person.avatarUrl} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex justify-between gap-2">
            <span className="truncate text-sm font-semibold">
              {person.name}
            </span>
            {at && (
              <span className="shrink-0 text-xs text-subtle">
                {today ? format.time(at) : format.shortDate(at)}
              </span>
            )}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] text-muted-foreground">
              {last?.sender === selfId
                ? t("you", { message: preview })
                : preview}
            </span>
            {conversation.unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-primary-foreground">
                {conversation.unreadCount}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

function ThreadHeader({
  person,
  role,
  onBack,
}: {
  person: Conversation["doctor"]
  role: Exclude<Role, "admin">
  onBack: () => void
}) {
  const t = useTranslations("chat")
  const tc = useTranslations("common")
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
      <button
        type="button"
        onClick={onBack}
        aria-label={t("back")}
        className="inline-flex size-9 items-center justify-center md:hidden"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
      </button>
      <UserAvatar name={person.name} src={person.avatarUrl} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
        {role === "patient"
          ? tc("doctorName", { name: person.name })
          : person.name}
      </span>
    </header>
  )
}
