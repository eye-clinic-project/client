/** Small local-time date helpers (no timezone conversions; all use the browser's zone). */

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Midnight of the first day of the week. `weekStartsOn`: 0 = Sunday, 6 = Saturday. */
export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const diff = (copy.getDay() - weekStartsOn + 7) % 7
  copy.setDate(copy.getDate() - diff)
  return copy
}

export function sameDay(a: Date | string, b: Date | string): boolean {
  const left = new Date(a)
  const right = new Date(b)
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

/** Format for <input type="date"> (YYYY-MM-DD, local date). */
export function toDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Build a local Date from a date input (YYYY-MM-DD) and a time input (HH:mm). */
export function combine(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}
