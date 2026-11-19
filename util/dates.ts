export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

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

export function toDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function combine(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}
