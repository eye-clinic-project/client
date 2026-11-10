"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/rc/ui"
import { homeFor, useSession } from "@/hooks/use-session"

export default function HomePage() {
  const { me, loading } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (!loading) router.replace(me ? homeFor(me) : "/login")
  }, [loading, me, router])
  return <Spinner />
}
