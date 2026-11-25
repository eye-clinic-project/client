import type { Language, User } from "@/types/api"
import { api } from "./api"

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<User, void>({
      query: () => "/user/me",
      providesTags: ["Me"],
    }),
    updateMe: build.mutation<
      User,
      Partial<{ name: string; city: string; language: Language }>
    >({
      query: (body) => ({ url: "/user/me", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
    uploadAvatar: build.mutation<User, FormData>({
      query: (body) => ({ url: "/user/me/avatar", method: "PUT", body }),
      invalidatesTags: ["Me"],
    }),
    removeAvatar: build.mutation<User, void>({
      query: () => ({ url: "/user/me/avatar", method: "DELETE" }),
      invalidatesTags: ["Me"],
    }),
    logoutEverywhere: build.mutation<void, { deviceToken?: string }>({
      query: (body) => ({
        url: "/authentication/logout",
        method: "POST",
        body: { type: "all", ...body },
      }),
    }),
    registerDevice: build.mutation<void, { token: string; platform: "web" }>({
      query: (body) => ({ url: "/user/me/devices", method: "PUT", body }),
    }),
    unregisterDevice: build.mutation<void, { token: string }>({
      query: (body) => ({ url: "/user/me/devices", method: "DELETE", body }),
    }),
  }),
})

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useRegisterDeviceMutation,
  useUnregisterDeviceMutation,
} = userApi
