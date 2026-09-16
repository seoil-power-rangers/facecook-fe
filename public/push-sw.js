/**
 * 콕찔러보기 서비스워커.
 *
 * 두 가지 일을 한다.
 *  1. 웹 푸시 수신/클릭 처리
 *  2. PWA 설치 조건 충족 — 브라우저가 "홈 화면에 추가"를 띄우려면 fetch 핸들러가
 *     있는 서비스워커가 등록돼 있어야 한다
 *
 * 화면 내용은 캐시하지 않는다. 부스 3일짜리 행사라 오래된 화면이 남는 게
 * 새로 받는 것보다 위험하다 — 네트워크가 끊겼을 때 offline.html만 대신 보여준다.
 */

const CACHE_NAME = "facecook-shell-v1";
const OFFLINE_PATH = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_PATH))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // 화면 이동만 가로챈다. API·정적 파일은 그대로 네트워크로 보낸다.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_PATH).then((cached) => cached ?? Response.error()),
    ),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "콕찔러보기";
  const options = {
    body: payload.body || "새로운 알림이 도착했어요.",
    data: { url: safePath(payload.url) },
    tag: payload.type || "facecook-notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
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
