self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "face 콕";
  const options = {
    body: payload.body || "새로운 알림이 도착했어요.",
    data: { url: safePath(payload.url) },
    tag: payload.type || "facecook-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = safePath(event.notification.data?.url);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const visibleClient = clients.find((client) => "focus" in client);
      if (visibleClient) {
        return visibleClient.navigate(path).then(() => visibleClient.focus());
      }
      return self.clients.openWindow(path);
    }),
  );
});

function safePath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return "/main";
  return value.startsWith("//") ? "/main" : value;
}
