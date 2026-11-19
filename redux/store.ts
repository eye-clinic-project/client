import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"

import { api } from "@/service/api"
import type { Language } from "@/types/api"
import { chatSlice } from "./slices/chat.slice"
import { uiSlice } from "./slices/ui.slice"

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [uiSlice.name]: uiSlice.reducer,
  [chatSlice.name]: chatSlice.reducer,
})

export function makeStore(language: Language) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { ui: { ...uiSlice.getInitialState(), language } },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  })
  setupListeners(store.dispatch)
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore["dispatch"]
