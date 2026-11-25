# 7. Internationalization, Theming & UI Kit

## 7.1 i18n with next-intl (no locale in the URL)

- The locale comes from the **`language` cookie** (`en` default, `ar` supported),
  resolved in `src/i18n/request.ts` via `resolveLanguage()`.
- The time zone comes from the **`tz` cookie**, written by `AppProviders` from the
  browser; falls back to `Africa/Cairo`.
- `app/layout.tsx` sets `<html lang dir>`; `directionOf("ar") === "rtl"`.
- `UiProvider` (`contexts/ui-context.tsx`) starts with the same value; the request
  layer sends it to the backend as `x-language`.
- `components/common/language-select.tsx` writes the `language` cookie and calls
  `router.refresh()`. `components/settings/preferences-section.tsx` also saves the
  choice to the user's account (`updateMe({ language })`).

### Messages
```
src/i18n/messages/
  en/  admin.json analyses.json appointments.json auth.json chat.json common.json
       dashboard.json meta.json notifications.json patient.json patients.json
       reports.json settings.json shell.json validation.json verification.json
       index.ts   ← imports every namespace
  ar/  (same files)
```
`global.d.ts` types `next-intl` with the English messages, so `t("missing.key")`
is a **type error**. Add new keys to `en` first, then mirror them in `ar`.

Usage:
- Server: `const t = await getTranslations("auth.panel")`
- Client: `const t = useTranslations("analyses.create")`
- Page titles: `export const generateMetadata = pageMetadata("<key in meta.json>")`
- Enum labels (statuses, eye side, DR level…): `lib/i18n/use-labels.ts`

Adding a namespace: create `i18n/messages/en/<ns>.json` and `i18n/messages/ar/<ns>.json`,
then register it in **both** `index.ts` files.

### RTL tips
- Prefer logical Tailwind utilities: `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`,
  `text-start` instead of left/right.
- Directional icons (arrows, chevrons) may need `rtl:rotate-180`.
- Force `dir="ltr"` on inputs that are always Latin (emails, phone numbers, codes).
- The toaster position flips by language (`AppProviders`).

## 7.2 Theming

- `next-themes` with `attribute="class"`, `defaultTheme="system"`.
- Hotkey **`d`** toggles dark mode when focus is not in an input
  (`ThemeHotkey` in `components/theme-provider.tsx`).
- Tailwind v4 has no `tailwind.config`; tokens are defined in `app/globals.css`:
  - `:root` / `.dark` hold CSS variables (OKLCH colors),
  - `@theme inline` maps them to utilities (`bg-brand`, `text-warning`, …),
  - `@custom-variant dark (&:is(.dark *))`.

Project tokens beyond shadcn's defaults:
`brand, brand-strong, brand-soft, brand-panel, brand-glow, surface, subtle,
success(-soft), warning(-soft), danger(-soft)`.

**Rule:** use tokens, not raw hex/Tailwind palette colors, so both themes work.

## 7.3 UI kit

| Layer | Folder | Notes |
|-------|--------|-------|
| Primitives | `components/ui/` | shadcn (`style: base-mira`, built on `@base-ui/react`). Add with `npx shadcn@latest add <name>`. Keep local edits minimal so updates stay easy. |
| Form fields | `components/form/` | RHF-aware wrappers (doc 6) |
| Page blocks | `components/page/` | `PageHeader`, `Panel`, `TabBar`, `SearchInput`, `Pagination`, `ConfirmDialog`, `EmptyState`/states |
| Feature parts | `components/{appointment,chat,notifications,patient,settings,auth,brand}/` | Shared between roles |
| Media | `protected-image.tsx`, `image-preview.tsx`, `pdf-preview.tsx` | Authenticated files via `useProtectedFile` |
| Misc | `status-chip.tsx`, `user-avatar.tsx`, `theme-toggle.tsx`, `language-select.tsx` | |

- Combine classes with `cn()` (`lib/utils.ts`).
- Icons: `lucide-react`, with `aria-hidden="true"` when decorative.
- Feedback: `toast` from `sonner`.
- Formatting helpers: `lib/format.ts`, `lib/dates.ts`.

Next: [8. Recipes →](./08-recipes.md)
