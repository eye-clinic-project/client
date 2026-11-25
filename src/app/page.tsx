import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { ROLE_HOME } from "@/lib/auth/constants"

export default async function Page() {
  const session = await auth()
  const role = session?.profile?.role
  redirect(role && session?.accessToken ? ROLE_HOME[role] : "/sign-in")
}
