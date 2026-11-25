/**
 * In-app notifications (/notification). New ones arrive via push, which
 * invalidates the "Notification" tag (see use-push-notifications).
 */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type { AppNotification, NotificationPage } from "@/types/api"

export const useListNotificationsQuery = defineQuery<
  NotificationPage,
  { unread?: boolean; page?: number; size?: number }
>({
  name: "listNotifications",
  query: (params) => ({ url: "/notification", params }),
  providesTags: [{ type: "Notification", id: "LIST" }],
})

export const useGetUnreadCountQuery = defineQuery<
  { unreadCount: number },
  void
>({
  name: "getUnreadCount",
  query: () => "/notification/unread-count",
  providesTags: [{ type: "Notification", id: "COUNT" }],
})

export const useMarkNotificationReadMutation = defineMutation<
  AppNotification,
  string
>({
  query: (id) => ({ url: `/notification/${id}/read`, method: "PATCH" }),
  invalidatesTags: ["Notification"],
})

export const useMarkAllNotificationsReadMutation = defineMutation<
  { updated: number },
  void
>({
  query: () => ({ url: "/notification/read-all", method: "PATCH" }),
  invalidatesTags: ["Notification"],
})

export const useDeleteNotificationMutation = defineMutation<void, string>({
  query: (id) => ({ url: `/notification/${id}`, method: "DELETE" }),
  invalidatesTags: ["Notification"],
})
