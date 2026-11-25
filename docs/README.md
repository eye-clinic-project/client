# RetinaCare Client — Maintainer Roadmap

This folder is the developer guide for the RetinaCare web client. Read it in order
and you will understand the application from A to Z: first the core design, then
each subsystem, and last the recipes for everyday changes.

> RetinaCare is a diabetic-retinopathy care platform. Doctors upload fundus images,
> an AI service grades them, the doctor reviews the result and sends a report to the
> patient. Patients book appointments, read reports and chat with their doctor.
> Admins verify doctor licenses and manage users.

## Reading order

| # | Document | What you learn | Time |
|---|----------|----------------|------|
| 1 | [Core architecture](./01-core-architecture.md) | Stack, layers, folder map, the life of a request. **Start here.** | 20 min |
| 2 | [Auth & session](./02-auth-and-session.md) | NextAuth, `proxy.ts`, token refresh, the client token store, sign-out | 25 min |
| 3 | [Data layer](./03-data-layer.md) | Query cache (`lib/query`), services, cache tags, server-side `serverApi`, errors | 20 min |
| 4 | [State, realtime & push](./04-state-realtime-push.md) | Context state, Socket.IO chat, Firebase push, notification deep links | 20 min |
| 5 | [Routing & features](./05-routing-and-features.md) | Every route per role, the page pattern, the doctor verification gate | 20 min |
| 6 | [Forms & validation](./06-forms-and-validation.md) | Zod schemas, react-hook-form, translated validation messages | 15 min |
| 7 | [i18n, theming & UI kit](./07-i18n-theming-ui.md) | next-intl (en/ar + RTL), dark mode, design tokens, shared components | 15 min |
| 8 | [Recipes](./08-recipes.md) | Step-by-step: add an endpoint, a page, a form, a translation, a role | as needed |
| 9 | [Conventions & maintenance](./09-conventions-and-maintenance.md) | Scripts, env vars, lint/format, Next.js 16 caveats, checklist, known gaps | 10 min |

## The 60-second version

```
Browser ──► proxy.ts (role gate) ──► app/<role>/layout.tsx (requireRole)
                                         │
                                         ▼
                              page.tsx (server, thin) ──► *-view.tsx (client)
                                                              │
                                    query hooks (src/services/*.service.ts)
                                                              │
                              src/lib/api/request.ts fetch ── tokenStore (Bearer)
                                                              │
                                                      Backend REST API (:9090)
```

- **Next.js 16 App Router**, React 19, TypeScript strict.
- **Auth.js (next-auth v5)** keeps the backend's access/refresh tokens inside an
  encrypted JWT cookie. The browser never stores tokens in `localStorage`.
- **The query hooks in `src/services/`** (fetch + a small Context-based cache) are the only way client code talks to the REST API.
- **Socket.IO** for chat, **Firebase Cloud Messaging** for push.
- **next-intl** with English and Arabic (RTL), chosen by a `language` cookie.
- **Tailwind CSS v4 + shadcn/ui (Base UI)** for the interface.

## Before you change anything

1. Read `AGENTS.md`: this Next.js version differs from older docs. The real docs
   ship in `node_modules/next/dist/docs/`.
2. Run `npm run typecheck && npm run lint` before and after your change.
3. When you change a subsystem, update the matching document here in the same
   commit. A stale roadmap is worse than none.
