"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Alert, Avatar, Button, Card, Chip, EmptyState, Input, PageTitle, Select, Spinner } from "@/components/rc/ui"
import { useApi } from "@/hooks/use-api"
import { useSession } from "@/hooks/use-session"
import type { ApiUser, UserRole } from "@/lib/api-types"
import { fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { adminService } from "@/service/admin.service"
import { errorMessage } from "@/service/api-client"

const PAGE_SIZE = 15

export function AdminUsers() {
  const { t } = useI18n()
  const a = t.admin
  const { me } = useSession()
  const [role, setRole] = useState<UserRole | "">("")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const list = useApi(
    () => adminService.users({ role: role || undefined, search: query || undefined, page, size: PAGE_SIZE }),
    [role, query, page],
  )

  async function toggle(user: ApiUser) {
    setBusyId(user.id)
    setError(null)
    try {
      const updated = await adminService.setActive(user.id, user.isActive === false)
      list.setData((prev) => ({ ...prev!, items: prev!.items.map((u) => (u.id === updated.id ? updated : u)) }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageTitle eyebrow={a.eyebrow}>{a.usersTitle}</PageTitle>
      <p className="-mt-4 max-w-2xl text-[15px] text-muted-foreground">{a.usersSubtitle}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{a.searchUsers}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={a.searchUsers} className="h-11 ps-9" />
        </label>
        <Select
          aria-label={a.roles.all}
          value={role}
          onChange={(e) => {
            setRole(e.target.value as UserRole | "")
            setPage(1)
          }}
          className="h-11 sm:w-48"
        >
          <option value="">{a.roles.all}</option>
          <option value="doctor">{a.roles.doctor}</option>
          <option value="patient">{a.roles.patient}</option>
          <option value="admin">{a.roles.admin}</option>
        </Select>
      </div>

      {error && <Alert>{error}</Alert>}
      {list.error ? <Alert>{errorMessage(list.error)}</Alert> : null}

      <Card className="overflow-hidden">
        {list.loading && !list.data && <Spinner />}
        {list.data && !list.data.items.length && <EmptyState title={a.noUsers} />}
        <ul>
          {list.data?.items.map((user) => {
            const self = user.id === me?.id
            const active = user.isActive !== false
            return (
              <li key={user.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-t-0">
                <Avatar name={user.name} src={user.avatarUrl} size={40} />
                <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <span className="flex items-center gap-2 truncate font-semibold">
                    {user.name}
                    {self && <Chip className="h-5 text-[11px]">{a.you}</Chip>}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{user.email}</span>
                </div>
                <Chip className="capitalize">{t.common[user.role as "doctor" | "patient"] ?? a.roles.admin}</Chip>
                <span className="hidden w-32 text-sm text-muted-foreground md:block">
                  {a.joined} {fmtDate(user.createdAt ?? null)}
                </span>
                <span className={cn("w-20 text-sm font-medium", active ? "text-primary" : "text-destructive")}>
                  {active ? t.status.active : a.disabled}
                </span>
                <Button
                  size="sm"
                  variant={active ? "danger" : "outline"}
                  disabled={self}
                  loading={busyId === user.id}
                  onClick={() => void toggle(user)}
                  className="w-24"
                >
                  {active ? a.disable : a.enable}
                </Button>
              </li>
            )
          })}
        </ul>
      </Card>

      {list.data && list.data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t.common.previous}
          </Button>
          <span className="text-sm text-muted-foreground">{a.pageOf(page, list.data.pages)}</span>
          <Button variant="outline" size="sm" disabled={page >= list.data.pages} onClick={() => setPage(page + 1)}>
            {t.common.next}
          </Button>
        </div>
      )}
    </>
  )
}
