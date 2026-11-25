"use client"

/** In-page navigation for the settings page (anchor links to each section). */

import { useTranslations } from "next-intl"

export function SettingsNav({
  items,
}: {
  items: { id: string; label: string }[]
}) {
  const t = useTranslations("settings")
  return (
    <nav aria-label={t("sections")} className="xl:sticky xl:top-6">
      <ul className="flex gap-1 overflow-x-auto border-b border-border xl:flex-col xl:border-s xl:border-b-0">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="-mb-px block border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground xl:-ms-px xl:mb-0 xl:border-s-2 xl:border-b-0"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
