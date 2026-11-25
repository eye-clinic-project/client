import type { AppNotification, NotificationPage } from "@/types/api"
import { api } from "./api"

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<
      NotificationPage,
      { unread?: boolean; page?: number; size?: number }
    >({
      query: (params) => ({ url: "/notification", params }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadCount: build.query<{ unreadCount: number }, void>({
      query: () => "/notification/unread-count",
      providesTags: [{ type: "Notification", id: "COUNT" }],
    }),
    markNotificationRead: build.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notification/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: "/notification/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: build.mutation<void, string>({
      query: (id) => ({ url: `/notification/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi
