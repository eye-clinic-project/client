import { configureStore } from "@reduxjs/toolkit"

import workspaceReducer from "@/lib/redux/features/workspace/workspaceSlice"

export const makeStore = () =>
  configureStore({
    reducer: {
      workspace: workspaceReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
