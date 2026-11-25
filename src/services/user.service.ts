/** Current user's account (/user/me): profile, avatar, push devices, log out everywhere. */

import { defineMutation, defineQuery } from "@/lib/query/define"
import type { Language, User } from "@/types/api"

export const useGetMeQuery = defineQuery<User, void>({
  name: "getMe",
  query: () => "/user/me",
  providesTags: ["Me"],
})

export const useUpdateMeMutation = defineMutation<
  User,
  Partial<{ name: string; city: string; language: Language }>
>({
  query: (body) => ({ url: "/user/me", method: "PATCH", body }),
  invalidatesTags: ["Me"],
})

export const useUploadAvatarMutation = defineMutation<User, FormData>({
  query: (body) => ({ url: "/user/me/avatar", method: "PUT", body }),
  invalidatesTags: ["Me"],
})

export const useRemoveAvatarMutation = defineMutation<User, void>({
  query: () => ({ url: "/user/me/avatar", method: "DELETE" }),
  invalidatesTags: ["Me"],
})

// Revokes every session of this user. Use through `useSignOut({ everywhere: true })`.
export const useLogoutEverywhereMutation = defineMutation<
  void,
  { deviceToken?: string }
>({
  query: (body) => ({
    url: "/authentication/logout",
    method: "POST",
    body: { type: "all", ...body },
  }),
})

// Register/remove this browser's FCM token for push notifications.
export const useRegisterDeviceMutation = defineMutation<
  void,
  { token: string; platform: "web" }
>({
  query: (body) => ({ url: "/user/me/devices", method: "PUT", body }),
})

export const useUnregisterDeviceMutation = defineMutation<
  void,
  { token: string }
>({
  query: (body) => ({ url: "/user/me/devices", method: "DELETE", body }),
})
