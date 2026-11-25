/** Admin area layout: role guard + admin frame. (No chat/push for admins.) */

import { AdminShell } from "@/components/layout/admin-shell"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole("admin")
  return <AdminShell profile={profile}>{children}</AdminShell>
}
