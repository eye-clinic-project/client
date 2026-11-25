"use client"

/**
 * React Context that hands the per-tab QueryClient to the query/mutation hooks.
 * Mounted once in AppProviders, inside UiProvider (it reads the current language).
 */

import { createContext, useContext, useState, type ReactNode } from "react"

import { useUi } from "@/contexts/ui-context"

import { QueryClient } from "./client"

const QueryClientContext = createContext<QueryClient | null>(null)

export function QueryProvider({ children }: { children: ReactNode }) {
  const { getLanguage } = useUi()
  const [client] = useState(() => new QueryClient(getLanguage))
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}

export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext)
  if (!client)
    throw new Error("useQueryClient must be used inside QueryProvider")
  return client
}
