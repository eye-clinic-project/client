import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"
import { AdminQueue } from "./admin-queue"

export const generateMetadata = pageMetadata("admin")

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return <AdminQueue initialId={single(params.doctor) ?? null} />
}
