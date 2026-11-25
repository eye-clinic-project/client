# 8. Recipes

Step-by-step guides for the most common changes. Each one lists every file you
touch, in order.

---

## R1. Add a backend endpoint

1. **Type** the response/request in `types/api.ts`.
2. **Define** it in the matching `services/<module>.service.ts`:
   ```ts
   export const useArchiveReportMutation = defineMutation<Report, string>({
     query: (id) => ({ url: `/report/${id}/archive`, method: "POST" }),
     invalidatesTags: (_result, id) => [
       { type: "Report", id },
       { type: "Report", id: "LIST" },
     ],
   })
   ```
   Queries use `defineQuery` and need a unique `name` (it is part of the cache key).
3. New entity? Add its tag to `TagType` in `lib/query/client.ts`.
4. Lists: `providesTags: (data) => listTags("Report", data)`.

## R2. Add a page

1. Create `app/<role>/<path>/page.tsx` (server, thin):
   ```tsx
   import { pageMetadata } from "@/lib/i18n/metadata"
   import { ThingView } from "./thing-view"
   export const generateMetadata = pageMetadata("thing")
   export default function ThingPage() { return <ThingView /> }
   ```
2. Create `thing-view.tsx` with `"use client"`; use `PageHeader`, `Panel`,
   loading/empty/error states, and the query hooks from `services/`.
3. Add `"thing"` to `i18n/messages/en/meta.json` **and** `i18n/messages/ar/meta.json`.
4. Add a nav item in the role shell (`components/layout/<role>-shell.tsx`) and a
   label in `i18n/messages/*/shell.json`.
5. Doctor page needed before approval? Add it to `PENDING_ROUTES` in
   `doctor-shell.tsx`.
6. No `proxy.ts` change is needed: anything under `/<role>` is already protected.

## R3. Add a form

1. Schema in `validation/<domain>.schema.ts` using `common.schema.ts` helpers and
   `vm()` keys; `.transform()` into the API body; export `XxxInput`.
2. Keys in `i18n/messages/{en,ar}/validation.json`.
3. Component: `useForm<XxxInput, unknown, Output>({ resolver: zodResolver(schema), defaultValues })`,
   fields from `components/form/`, `FormAlert` + `useErrorText()` for server errors.
4. Mutation `.unwrap()` inside `try/catch`, `toast.success` on success.

## R4. Add or change a translation

1. Add the key to `i18n/messages/en/<ns>.json` (TypeScript now knows it).
2. Add the same key to `i18n/messages/ar/<ns>.json`.
3. New namespace → also register it in both `i18n/messages/*/index.ts`.
4. Run `npm run typecheck`.

## R5. Add a session field

1. `types/next-auth.d.ts` → `SessionProfile`.
2. `validation/session.schema.ts` → `profileSchema`.
3. `auth.ts` → `loadProfile()` mapping.
4. After the user changes it: `await update({ kind: "reload-profile" })` from
   `useSession()`.

## R6. React to a new push / notification type

1. Add the type to `NotificationType` in `types/api.ts`.
2. `lib/notification-link.ts`: add a `RULES` entry for its `link` and a `fallback`
   route for each role.
3. `hooks/use-push-notifications.ts`: invalidate the relevant tags in `onMessage`.
4. Labels/icons in `components/notifications/notifications-view.tsx` and
   `i18n/messages/*/notifications.json`.

## R7. Add a socket event

1. Type it in `lib/socket/chat.socket.ts` (`ServerToClientEvents` or
   `ClientToServerEvents`).
2. Server → client: handle it in `chat-socket-provider.tsx` (`on` + `off`),
   call a `useChatActions()` action (add it in `contexts/chat-context.tsx`) or invalidate tags.
3. Client → server: add a method to `useChat`, use `emitWithAck` + `ensureOk` when
   an ack is expected.

## R8. Add a new role (big change)

1. `Role` in `types/api.ts`; `profileSchema` role enum.
2. `ROLE_HOME` in `lib/auth/constants.ts` (proxy picks it up automatically).
3. `app/<role>/layout.tsx` with `requireRole("<role>")` and a shell.
4. `notificationRoute` fallbacks; any `Record<Role, …>` the compiler flags.

## R9. Add a shadcn component

```bash
npx shadcn@latest add <component>
```
It lands in `components/ui/`. Run `npm run format` afterwards.

## R10. Show a protected file (image/PDF)

Use `ProtectedImage` / `PdfPreview` or `useProtectedFile(path)`; to open in a tab
use `openProtectedFile(path)`. Never put the access token in a URL.

Next: [9. Conventions & maintenance →](./09-conventions-and-maintenance.md)
