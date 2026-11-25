# RetinaCare — client

Next.js 16 (App Router) front end for RetinaCare.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck && npm run lint
```

## Layout

```
src/
  app/          routes (App Router)
  components/   ui/ (shadcn), common/, form/, page/, layout/, providers/, <feature>/
  contexts/     React Context state (ui, chat)
  services/     query & mutation hooks, one file per backend module
  hooks/        reusable client hooks
  lib/          api/ (fetch), query/ (cache), socket/, auth/, i18n/, helpers
  i18n/         next-intl request config + messages/{en,ar}
  validation/   Zod schemas
  types/        API contract
docs/           architecture & maintenance guides — start at docs/README.md
public/         static files, FCM service worker
```

Add shadcn components with `npx shadcn@latest add <name>` (they land in `src/components/ui`).
