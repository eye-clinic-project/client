import { Suspense } from "react"

import { ChatPage } from "@/components/chat/chat-page"

export default function PatientMessagesRoute() {
  return (
    <Suspense>
      <ChatPage role="patient" />
    </Suspense>
  )
}
