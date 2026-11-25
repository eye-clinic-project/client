"use client"

/** "Showing X–Y of Z" with previous/next buttons for paginated lists (page is 1-based). */

import { useTranslations } from "next-intl"

export function Pagination({
  page,
  size,
  total,
  pages,
  onChange,
}: {
  page: number
  size: number
  total: number
  pages: number
  onChange: (page: number) => void
}) {
  const t = useTranslations("common")
  if (total === 0) return null
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  const button =
    "min-h-9 border border-border bg-background px-3 text-[13px] font-semibold disabled:opacity-40 hover:enabled:bg-muted"
  return (
    <nav
      aria-label={t("showing", { from, to, total })}
      className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-subtle"
    >
      <span>{t("showing", { from, to, total })}</span>
      <span className="flex gap-2">
        <button
          type="button"
          className={button}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {t("previous")}
        </button>
        <button
          type="button"
          className={button}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          {t("next")}
        </button>
      </span>
    </nav>
  )
}
