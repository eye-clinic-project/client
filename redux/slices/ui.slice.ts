import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Language } from "@/types/api"

interface UiState {
  language: Language
  pushPermission: NotificationPermission | "unsupported"
  pushSubscribed: boolean
}

const initialState: UiState = {
  language: "en",
  pushPermission: "default",
  pushSubscribed: false,
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    languageChanged(state, action: PayloadAction<Language>) {
      state.language = action.payload
    },
    pushPermissionChanged(
      state,
      action: PayloadAction<UiState["pushPermission"]>
    ) {
      state.pushPermission = action.payload
    },
    pushSubscriptionChanged(state, action: PayloadAction<boolean>) {
      state.pushSubscribed = action.payload
    },
  },
})

export const {
  languageChanged,
  pushPermissionChanged,
  pushSubscriptionChanged,
} = uiSlice.actions
