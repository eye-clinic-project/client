# 5. Routing & Features by Role

## 5.1 Route map

### Public — `app/(auth)/` (shared split-panel layout with theme + language switch)
| Route | Purpose |
|-------|---------|
| `/sign-in` | Credentials + Google sign-in; shows `?error=` / `?expired=1` messages |
| `/sign-up` | Account creation (sign-in / sign-up tabs via `components/auth/auth-tabs.tsx`) |
| `/verify-email` | OTP email verification |
| `/forgot-password`, `/reset-password` | Password recovery via OTP |
| `/complete-profile` | Google users without a city (forced by `proxy.ts`) |

### Utility
| Route | Purpose |
|-------|---------|
| `/` | Redirects to role home or `/sign-in` |
| `/open?link=` | Push-notification landing (doc 4) |
| `/api/auth/*` | Auth.js handlers |

### Doctor — `app/doctor/` (`DoctorShell`)
| Route | Main component | Purpose |
|-------|----------------|---------|
| `/doctor` | `doctor-dashboard.tsx` | Overview, counts, shortcuts |
| `/doctor/verification` | `verification-view.tsx` | Upload license, see status |
| `/doctor/patients` | `patients-view.tsx`, `add-patient-panel.tsx` | List, create, search & assign patients |
| `/doctor/patients/[id]` | `patient-detail.tsx` | Patient profile, analyses, reports |
| `/doctor/analyses` | `analyses-view.tsx`, `ai-service-panel.tsx` | List, filters, AI health, retry |
| `/doctor/analyses/new?patient=` | `new-analysis-form.tsx` | Upload fundus image |
| `/doctor/analyses/[id]` | `analysis-review.tsx`, `review-form.tsx` | AI result, Grad-CAM, doctor review |
| `/doctor/reports`, `/doctor/reports/[id]` | `reports-view.tsx`, `report-editor.tsx` | Draft, edit, regenerate, send, download |
| `/doctor/appointments` | `appointments-view.tsx`, `availability-form.tsx` | Availability slots, requests to decide |
| `/doctor/messages` | `components/chat/chat-view.tsx` | Chat with patients |
| `/doctor/notifications` | `components/notifications/notifications-view.tsx` | Inbox |
| `/doctor/settings` | `doctor-settings.tsx` | Profile, clinic, license, security, prefs, notifications |

### Patient — `app/patient/` (`PatientShell`)
| Route | Purpose |
|-------|---------|
| `/patient` | Home (`patient-home.tsx`) |
| `/patient/doctors` | Assigned doctors |
| `/patient/book` | Book an appointment (`booking-form.tsx`, `slot-picker.tsx`) |
| `/patient/appointments`, `/[id]` | Visits, cancel/reschedule requests |
| `/patient/reports`, `/[id]` | Sent reports, download |
| `/patient/messages`, `/notifications`, `/settings` | Same shared components as the doctor |

### Admin — `app/admin/` (`AdminShell`)
| Route | Purpose |
|-------|---------|
| `/admin` | Doctor verification queue (`admin-queue.tsx`), review drawer (`doctor-review.tsx`, opened with `?doctor=<id>`), user status |

## 5.2 The page pattern

Every route follows the same split:

```tsx
// app/doctor/analyses/[id]/page.tsx  — server, thin
import { pageMetadata } from "@/lib/i18n/metadata"
import { AnalysisReview } from "./analysis-review"

export const generateMetadata = pageMetadata("analysis")   // key in i18n/messages/*/meta.json

export default async function AnalysisPage({
  params,
}: { params: Promise<{ id: string }> }) {                   // params is a Promise in Next 16
  const { id } = await params
  return <AnalysisReview id={id} />
}
```

```tsx
// app/doctor/analyses/[id]/analysis-review.tsx — "use client", owns data + UI
```

- `params` and `searchParams` are **Promises** — always `await` them.
- Use `single()` from `lib/search-params.ts` to read a query param.
- Co-locate route-only components next to `page.tsx` (`*-view.tsx`,
  `*-form.tsx`). Move a component to `components/<feature>/` only when two routes
  share it.
- Use `components/page/*` for structure: `PageHeader`, `Panel`, `TabBar`,
  `SearchInput`, `Pagination`, `ConfirmDialog`, and `states.tsx`
  (`EmptyState`, error/loading states).

## 5.3 Role shells

`components/layout/sidebar-shell.tsx` is the generic layout (sidebar, mobile
menu, user card, optional banner). Each role shell builds its nav items:
`ShellNavItem { href, label, icon, badge?, badgeTone? }`.

Badges come from cheap queries (`size: 1` → read `count`).

## 5.4 Doctor verification gate

Doctors can sign in before an admin approves their license. `DoctorShell`:

- fetches `getMyVerification`,
- treats the doctor as **locked** until status is known and `approved`,
- allows only `/doctor`, `/doctor/verification`, `/doctor/settings`,
  `/doctor/notifications` while locked (other routes redirect to verification
  and don't render, so they don't fire requests that would 403),
- shows a status banner (missing / pending / rejected with reason),
- skips badge queries until approved,
- mounts `LicenseDraftUploader`, which uploads license files chosen during
  sign-up (`lib/license-draft.ts`) after the first sign-in.

If you add a doctor page that must work before approval, add it to
`PENDING_ROUTES`.

## 5.5 Core feature flows

**Analysis → Review → Report (doctor)**
1. `/doctor/analyses/new` uploads image (`createAnalysis`, FormData).
2. Backend processes (status `pending → processing → completed|failed`); the list
   polls and push notifications invalidate `Analysis`.
3. `failed` → `retryAnalysis`. AI availability: `getAiHealth`.
4. `/doctor/analyses/[id]` shows stage 1 findings, stage 2 level, Grad-CAM
   (protected image), and the `review-form` → `saveReview` (POST or PATCH).
5. Reports are created from analyses, edited in `report-editor`, then `sendReport`
   makes them visible to the patient.

**Appointments**
Doctor publishes availability → patient picks a slot (`listDoctorSlots`,
`bookAppointment`) → either side can request cancel/reschedule → the other side
decides (`decideRequest`).

**Admin verification**
Admin opens a doctor, views license documents (protected files), approves or
rejects with a reason → the doctor gets a notification → their shell unlocks.

Next: [6. Forms & validation →](./06-forms-and-validation.md)
