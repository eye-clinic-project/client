/**
 * Request gate (Next.js 16's name for middleware). Runs before every page.
 *
 * Decides where a request may go based on the session:
 * - Google user without a city   → only /complete-profile
 * - Auth pages (/sign-in, …)      → signed-in users go to their role home
 * - Role areas (/admin, /doctor, /patient)
 *     signed out  → /sign-in?callbackUrl=… (&expired=1 after a failed refresh)
 *     wrong role  → their own role home
 * - "/"                           → role home (or /sign-in)
 * Anything else (public pages) passes through.
 *
 * Layouts repeat the role check with requireRole() as a second safety net.
 */

import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  AUTH_ROUTES,
  COMPLETE_PROFILE_ROUTE,
  ROLE_HOME,
} from "@/lib/auth/constants"
import type { Role } from "@/types/api"

const ROLE_SECTIONS = Object.entries(ROLE_HOME) as [Role, string][]

/** True when `pathname` is `route` itself or any page below it. */
function matches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl
  const session = request.auth
  const role = session?.profile?.role
  const signedIn =
    Boolean(session?.accessToken && role) &&
    session?.error !== "RefreshTokenError"
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.nextUrl))

  // Unfinished Google sign-up: lock the user to the city form.
  if (session?.needsCity) {
    return pathname === COMPLETE_PROFILE_ROUTE
      ? NextResponse.next()
      : redirectTo(COMPLETE_PROFILE_ROUTE)
  }
  if (pathname === COMPLETE_PROFILE_ROUTE) {
    return redirectTo(signedIn && role ? ROLE_HOME[role] : "/sign-in")
  }

  if (AUTH_ROUTES.some((route) => matches(pathname, route))) {
    return signedIn && role ? redirectTo(ROLE_HOME[role]) : NextResponse.next()
  }

  // Which role area (if any) this path belongs to. Public paths pass through.
  const section = ROLE_SECTIONS.find(([, home]) => matches(pathname, home))
  if (!section && pathname !== "/") return NextResponse.next()

  if (!signedIn || !role) {
    const target = new URL("/sign-in", request.nextUrl)
    if (pathname !== "/")
      target.searchParams.set("callbackUrl", `${pathname}${search}`)
    if (session?.error === "RefreshTokenError")
      target.searchParams.set("expired", "1")
    return NextResponse.redirect(target)
  }

  if (pathname === "/" || section?.[0] !== role)
    return redirectTo(ROLE_HOME[role])
  return NextResponse.next()
})

/** Skip API routes, Next.js assets, the FCM service worker and static files. */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)",
  ],
}
