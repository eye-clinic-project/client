"use client"

/** Search box with icon and accessible label. Debounce the value with useDebounced() before querying. */

import { SearchIcon } from "lucide-react"
import { useId } from "react"

import { cn } from "@/lib/utils"

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  className,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const id = useId()
  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-2 border border-border bg-background px-3 focus-within:border-ring",
        className
      )}
    >
      <SearchIcon className="size-4 shrink-0 text-subtle" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}
