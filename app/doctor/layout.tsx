import { DoctorShell } from "@/components/layout/doctor-shell"
import { PushRegistrar } from "@/components/layout/push-registrar"
import { requireRole } from "@/lib/auth/require-role"
import { ChatSocketProvider } from "@/socket/chat-socket-provider"

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole("doctor")

  return (
    <ChatSocketProvider>
      <PushRegistrar />
      <DoctorShell profile={profile}>{children}</DoctorShell>
    </ChatSocketProvider>
  )
}
