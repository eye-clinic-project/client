import { apiClient } from "./api-client"
import type { NotificationItem, NotificationsPage } from "@/lib/api-types"

export const notificationService = {
  list: (query: { unread?: boolean; page?: number; size?: number } = {}) =>
    apiClient<NotificationsPage>("/notifications", { query }),

  markRead: (id: string) => apiClient<NotificationItem>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () => apiClient<{ updated: number }>("/notifications/read-all", { method: "PATCH" }),
}
