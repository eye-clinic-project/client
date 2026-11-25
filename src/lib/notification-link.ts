import type { NotificationType, Role } from "@/types/api"

type Rule = {
  pattern: RegExp
  route: (role: Role, id: string) => string | null
}

const RULES: Rule[] = [
  {
    pattern: /^\/analysis\/([^/?#]+)/,
    route: (role, id) =>
      role === "doctor"
        ? `/doctor/analyses/${id}`
        : role === "patient"
          ? "/patient/reports"
          : null,
  },
  {
    pattern: /^\/report\/([^/?#]+)/,
    route: (role, id) => (role === "admin" ? null : `/${role}/reports/${id}`),
  },
  {
    pattern: /^\/appointments?\/([^/?#]+)/,
    route: (role, id) =>
      role === "doctor"
        ? "/doctor/appointments"
        : role === "patient"
          ? `/patient/appointments/${id}`
          : null,
  },
  {
    pattern: /^\/chat\/conversations\/([^/?#]+)/,
    route: (role, id) =>
      role === "admin" ? null : `/${role}/messages?c=${encodeURIComponent(id)}`,
  },
  {
    pattern: /^\/doctor\/me\/verification/,
    route: (role) => (role === "doctor" ? "/doctor/verification" : null),
  },
  {
    pattern: /^\/admin\/doctors\/([^/?#]+)/,
    route: (role, id) =>
      role === "admin" ? `/admin?doctor=${encodeURIComponent(id)}` : null,
  },
  {
    pattern: /^\/patient\/me\/doctors/,
    route: (role) =>
      role === "patient"
        ? "/patient/doctors"
        : role === "doctor"
          ? "/doctor/patients"
          : null,
  },
]

const APP_ROUTE = /^\/(doctor|patient|admin)(\/|$|\?)/

function fallback(
  role: Role,
  type?: NotificationType,
  id?: string | null
): string {
  if (role === "admin") return "/admin"
  const routes: Record<NotificationType, string> =
    role === "doctor"
      ? {
          analysis: id ? `/doctor/analyses/${id}` : "/doctor/analyses",
          appointment: "/doctor/appointments",
          report: id ? `/doctor/reports/${id}` : "/doctor/reports",
          message: "/doctor/messages",
          system: "/doctor/verification",
          note: "/doctor/notifications",
          follow_up: "/doctor/appointments",
        }
      : {
          analysis: "/patient/reports",
          appointment: id
            ? `/patient/appointments/${id}`
            : "/patient/appointments",
          report: id ? `/patient/reports/${id}` : "/patient/reports",
          message: "/patient/messages",
          system: "/patient/notifications",
          note: "/patient/notifications",
          follow_up: "/patient/book",
        }
  return type ? routes[type] : `/${role}/notifications`
}

export function notificationRoute(
  role: Role,
  link?: string | null,
  type?: NotificationType,
  resourceId?: string | null
): string {
  const path = link ? link.replace(/^https?:\/\/[^/]+/, "") : ""
  for (const rule of RULES) {
    const match = rule.pattern.exec(path)
    if (match) {
      const route = rule.route(role, match[1] ?? "")
      if (route) return route
    }
  }
  if (
    APP_ROUTE.test(path) &&
    path.startsWith(`/${role}`) &&
    !path.startsWith(`/${role}/me`)
  )
    return path
  return fallback(role, type, resourceId)
}
