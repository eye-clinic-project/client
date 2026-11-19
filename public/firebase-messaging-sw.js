self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const notification = payload.notification || {}
  const data = payload.data || {}

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const focused = clients.some((client) => client.focused)
      if (focused) return undefined
      return self.registration.showNotification(notification.title || "RetinaCare", {
        body: notification.body || "",
        icon: notification.image || undefined,
        tag: data.resourceId || undefined,
        data: { link: data.link || "/" },
      })
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const link = event.notification.data?.link || ""
  const target = new URL(`/open?link=${encodeURIComponent(link)}`, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
