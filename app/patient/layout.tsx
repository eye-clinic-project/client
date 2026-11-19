import { PatientShell } from "@/components/layout/patient-shell"
import { PushRegistrar } from "@/components/layout/push-registrar"
import { requireRole } from "@/lib/auth/require-role"
import { ChatSocketProvider } from "@/socket/chat-socket-provider"

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole("patient")

  return (
    <ChatSocketProvider>
      <PushRegistrar />
      <PatientShell profile={profile}>{children}</PatientShell>
    </ChatSocketProvider>
  )
}
