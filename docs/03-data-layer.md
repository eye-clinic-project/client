# 3. Data Layer (fetch + Context query cache)

## 3.1 Three ways to call the backend

| Path | Used by | Auth | File |
|------|---------|------|------|
| Query/mutation hooks | All client components | `tokenStore` Bearer + refresh/retry | `src/services/*.service.ts` → `src/lib/api/request.ts` |
| `serverApi()` | Server code (Auth.js callbacks) | Explicit `accessToken` option | `src/lib/api/server-api.ts` |
| `fetchProtectedFile()` / `openProtectedFile()` | Images, PDFs, license docs | `tokenStore` + retry on 401 | `src/lib/api/protected-file.ts` |

If you are writing a component, you want the first one.

## 3.2 How it fits together

- **`lib/api/request.ts`** — the `fetch` wrapper. `createRequest(getLanguage)` returns
  `request(args)` which:
  1. `await tokenStore.ensureFresh()`
  2. sends `authorization` (from `tokenStore`) and `x-language` (from `UiProvider`)
  3. on `401` with a token: if the token already changed, retry; otherwise
     `forceRefresh()` and retry once
  4. unwraps `{ message, data }` → `data`; failures throw `HttpError { status, data }`
     (`status` is `"FETCH_ERROR"` when the server can't be reached).
  Args: `{ url, method?, params?, body?, responseType?: "json" | "blob", cache? }`.
  Plain-object bodies are sent as JSON; `FormData` as-is.
- **`lib/query/client.ts`** — `QueryClient`: caches results per key, de-duplicates
  in-flight requests, tracks provided tags, refetches on-screen queries when a tag
  is invalidated, and drops unused entries after 60 s. `reset()` clears everything
  (sign-out, language change).
- **`lib/query/provider.tsx`** — `QueryProvider` creates one client per tab and
  shares it through React Context; `useQueryClient()` reads it
  (`invalidateTags([...])`, `reset()`).
- **`lib/query/define.ts`** — `defineQuery` / `defineMutation` build the hooks:
  - `useXQuery(arg, { skip, pollingInterval })` →
    `{ data, currentData, error, isLoading, isFetching, isError, isSuccess, refetch, fulfilledTimeStamp }`.
    `data` keeps the previous result while a new arg loads.
  - `useXMutation()` → `[trigger, { isLoading, isError, data, error, originalArgs, reset }]`;
    `await trigger(arg)` gives `{ data } | { error }`, `trigger(arg).unwrap()` throws.
  - Outside components' render state: `useXMutation.execute(queryClient, arg)`.

Tag types (`TagType` in `lib/query/client.ts`): `Me, Analysis, AiHealth, Appointment,
Report, Notification, Doctor, DoctorVerification, Patient, Conversation, Message,
AdminDoctor, Review, Slot`.

## 3.3 Service files

Each backend module has one file in `src/services/` that exports its hooks, built
with `defineQuery` / `defineMutation`.

| File | Backend prefix | Main hooks |
|------|----------------|-----------|
| `auth.service.ts` | `/authentication` | sign-up, verify email, forgot/reset password |
| `user.service.ts` | `/user/me`, `/authentication/logout` | `useGetMeQuery`, update profile, avatar, devices, logout-everywhere |
| `doctor.service.ts` | `/doctor/...`, `/patient/me/doctors` | verification, clinic, patient search/assign |
| `patient.service.ts` | `/patient` | list/get/update patients, `getMyPatientRecord` |
| `analysis.service.ts` | `/analysis` | list/get/create/retry/delete, AI health, review get/save |
| `report.service.ts` | `/report` | CRUD, regenerate, send, download (Blob) |
| `appointment.service.ts` | `/appointment` | my appointments, availability, slots, book, cancel/reschedule requests, decide |
| `notification.service.ts` | `/notification` | list, unread count, mark read/all, delete |
| `chat.service.ts` | `/chat/conversations` | list/start conversations, list messages (history) |
| `admin.service.ts` | `/admin` | doctors list/detail, approve/reject, user status |

## 3.4 Cache tag conventions

- A list query provides `{type, id: "LIST"}` plus one tag per item — use the
  helper `listTags(type, data)` from `services/tags.ts` (accepts `Paginated` or
  arrays).
- A detail query provides `{type, id}`.
- Create/delete mutations invalidate `{type, id: "LIST"}`.
- Update mutations invalidate `{type, id}` **and** `LIST` when the change affects
  list rows.
- Cross-entity effects are explicit, e.g. `saveReview` invalidates the Review, the
  Analysis and the Analysis list.
- Realtime events invalidate tags too (socket → `Conversation/LIST`; push →
  `Notification`, `Appointment`, `Analysis`, `Report`, `Conversation`).

Example (`analysis.service.ts`):
```ts
export const useListAnalysesQuery = defineQuery<Paginated<Analysis>, AnalysisListParams>({
  name: "listAnalyses",
  query: (params) => ({ url: "/analysis", params }),
  providesTags: (data) => listTags("Analysis", data),
})

export const useRetryAnalysisMutation = defineMutation<Analysis | null, string>({
  query: (id) => ({ url: `/analysis/${id}/retry`, method: "POST" }),
  invalidatesTags: (_result, id) => [
    { type: "Analysis", id },
    { type: "Analysis", id: "LIST" },
  ],
})
```

When a `404` is a valid "nothing yet" answer, use `queryFn(arg, request)` and map it to `null`
(see `useGetReviewQuery`).

File uploads: pass `FormData` as `body` (the Zod schema builds it — see doc 6).

## 3.5 Errors

`lib/api/error.ts`:
- `ApiError` — thrown by `serverApi` / protected file fetches (`status`, `messages`,
  `errorCode`).
- `HttpError` (`lib/api/request.ts`) — thrown by client hooks (`status`, `data` = backend body).
- `messagesOf(body)` — normalizes `message: string | string[]`.

In components, always turn errors into text with the translated hook:
```ts
const errorText = useErrorText()       // lib/i18n/use-error-text.ts
try { await createAnalysis(body).unwrap() }
catch (e) { setError(errorText(e)) }
```
It prefers the backend's (already localized) message, then falls back to
`common.network`, `common.rateLimited`, or `common.unexpected`.

## 3.6 Types

`src/types/api.ts` holds every request/response shape. Rules:
- Name types after backend entities (`Analysis`, `Report`, `Appointment`…).
- Populated references use small ref types (`UserRef`).
- Optional/legacy fields are marked `?` with a JSDoc comment explaining when they
  are missing (see `Analysis.stage1`).

## 3.7 Polling and refresh

- Use `pollingInterval` sparingly. Current uses: unread count (60 s, shells), AI
  health (60 s), the analyses list (faster while items are running), and a single
  analysis every 5 s while it is `pending/processing` (`analysis-review.tsx`).
- Mutations invalidate tags only when they succeed.
- Use `skip` to avoid calls that will 403 (the doctor shell skips everything until
  the doctor is approved).

Next: [4. State, realtime & push →](./04-state-realtime-push.md)
