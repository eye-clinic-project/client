import { Suspense } from "react"

import { ChatPage } from "@/components/chat/chat-page"

export default function DoctorMessagesRoute() {
  return (
    <Suspense>
      <ChatPage role="doctor" />
    </Suspense>
  )
}
