import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { notificationRoute } from "@/lib/notification-link"
import { single, type SearchParams } from "@/lib/search-params"

export default async function OpenNotificationPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const link = single(params.link) ?? null
  const session = await auth()
  const role = session?.profile?.role
  if (!role || !session?.accessToken)
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(`/open?link=${encodeURIComponent(link ?? "")}`)}`
    )
  redirect(notificationRoute(role, link))
}
