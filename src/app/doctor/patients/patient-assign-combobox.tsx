"use client"

/**
 * Accessible combobox to search every patient (from 3 characters) and assign one.
 * Already-assigned results just open the patient. Keyboard: ↑/↓ to move, Enter to choose, Esc to close.
 */

import { CheckIcon, Loader2Icon, SearchIcon, UserPlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common/user-avatar"
import { useDebounced } from "@/hooks/use-debounced"
import { useErrorText } from "@/lib/i18n/use-error-text"
import { cn } from "@/lib/utils"
import {
  useAssignPatientMutation,
  useSearchAllPatientsQuery,
} from "@/services/doctor.service"
import type { PatientSearchResult } from "@/types/api"

export function PatientAssignCombobox() {
  const t = useTranslations("patients")
  const tc = useTranslations("common")
  const router = useRouter()
  const errorText = useErrorText()
  const id = useId()
  const listId = `${id}-list`
  const root = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(search.trim())
  const ready = debounced.length >= 3
  const { data, isFetching, isError } = useSearchAllPatientsQuery(
    { search: debounced, size: 20 },
    { skip: !ready }
  )
  const [assign, { isLoading: assigning, originalArgs }] =
    useAssignPatientMutation()
  const results = ready ? (data?.docs ?? []) : []
  const expanded = open && search.trim().length > 0

  // Close the list when clicking outside of it.
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [])

  const choose = async (result: PatientSearchResult) => {
    if (result.assigned) {
      router.push(`/doctor/patients/${result._id}`)
      return
    }
    try {
      await assign(result._id).unwrap()
      toast.success(t("assignedToast", { name: result.name }))
    } catch (caught) {
      toast.error(errorText(caught))
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter" && expanded && results[active]) {
      event.preventDefault()
      void choose(results[active])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const status = !ready
    ? t("startTyping")
    : isError
      ? tc("loadFailed")
      : isFetching && !data
        ? tc("loading")
        : results.length === 0
          ? t("noResults")
          : null

  return (
    <div ref={root} className="flex max-w-3xl flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {t("searchAll")}
      </label>
      <div className="relative">
        {expanded && (
          <div className="absolute inset-x-0 bottom-full z-30 mb-1 border border-border bg-popover text-popover-foreground shadow-lg">
            {status ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {status}
              </p>
            ) : (
              <ul
                id={listId}
                role="listbox"
                aria-label={t("searchAll")}
                className="max-h-80 overflow-y-auto"
              >
                {results.map((result, index) => {
                  const busy = assigning && originalArgs === result._id
                  return (
                    <li
                      key={result._id}
                      id={`${listId}-${result._id}`}
                      role="option"
                      aria-selected={index === active}
                      onPointerEnter={() => setActive(index)}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => void choose(result)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                        index === active ? "bg-muted" : "bg-popover"
                      )}
                    >
                      <UserAvatar
                        name={result.name}
                        src={result.avatarUrl}
                        className="size-9"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">
                          {result.name}
                        </span>
                        <span className="truncate text-xs text-subtle">
                          <span dir="ltr">{result.medicalRecordNumber}</span> ·{" "}
                          {result.city} · <span dir="ltr">{result.email}</span>
                        </span>
                      </span>
                      {result.assigned ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                          <CheckIcon className="size-3.5" aria-hidden="true" />
                          {t("assigned")}
                        </span>
                      ) : (
                        <span className="inline-flex min-h-8 shrink-0 items-center gap-1.5 border border-border px-2.5 text-xs font-semibold">
                          {busy ? (
                            <Loader2Icon
                              className="size-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <UserPlusIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          )}
                          {t("assign")}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
        <div className="flex min-h-11 items-center gap-2 border border-border bg-background px-3 focus-within:border-ring">
          <SearchIcon
            className="size-4 shrink-0 text-subtle"
            aria-hidden="true"
          />
          <input
            id={id}
            type="search"
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              expanded && results[active]
                ? `${listId}-${results[active]._id}`
                : undefined
            }
            autoComplete="off"
            value={search}
            placeholder={t("searchMinePlaceholder")}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            onChange={(event) => {
              setSearch(event.target.value)
              setActive(0)
              setOpen(true)
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {isFetching && (
            <Loader2Icon
              className="size-4 shrink-0 animate-spin text-subtle"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <p className="text-xs text-subtle">{t("searchAllHint")}</p>
      <span className="sr-only" role="status" aria-live="polite">
        {ready && data ? t("results", { count: results.length }) : ""}
      </span>
    </div>
  )
}
