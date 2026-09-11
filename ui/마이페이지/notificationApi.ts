const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const SERVICE_WORKER_PATH = "/push-sw.js";

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

interface VapidPublicKeyResponse {
  publicKey: string;
}

interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "NotificationApiError";
  }
}

export function notificationErrorMessage(error: unknown) {
  if (error instanceof NotificationApiError) {
    if (error.code === "UNAUTHORIZED") {
      return "로그인이 만료됐어요. 다시 로그인해주세요.";
    }
    return error.message;
  }
  return "알림 설정을 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  return isWebPushSupported() ? Notification.permission : "unsupported";
}

export async function hasPushSubscription() {
  if (!isWebPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  return (await registration.pushManager.getSubscription()) !== null;
}

export async function enablePushNotifications() {
  assertWebPushSupported();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new NotificationApiError(
      "PERMISSION_DENIED",
      "브라우저 알림 권한이 필요해요. 사이트 설정에서 알림을 허용해주세요.",
    );
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(await getVapidPublicKey()),
    }));

  try {
    await subscribePush(toSubscriptionRequest(subscription));
  } catch (error) {
    if (!existingSubscription) {
      await subscription.unsubscribe().catch(() => false);
    }
    throw error;
  }
}

export async function disablePushNotifications() {
  assertWebPushSupported();

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  await unsubscribePush();
  if (subscription && !(await subscription.unsubscribe())) {
    throw new NotificationApiError(
      "BROWSER_UNSUBSCRIBE_FAILED",
      "브라우저 알림 구독을 해제하지 못했어요. 다시 시도해주세요.",
    );
  }
}

async function getVapidPublicKey() {
  const response = await requestPush<VapidPublicKeyResponse>(
    "/api/push/vapid-public-key",
  );
  if (!response.publicKey) {
    throw new NotificationApiError(
      "INVALID_VAPID_KEY",
      "서버에서 알림 공개키를 받지 못했어요.",
    );
  }
  return response.publicKey;
}

function subscribePush(request: PushSubscriptionRequest) {
  return requestPush<void>("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

function unsubscribePush() {
  return requestPush<void>("/api/push/subscribe", { method: "DELETE" });
}

function toSubscriptionRequest(
  subscription: PushSubscription,
): PushSubscriptionRequest {
  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;

  if (!serialized.endpoint || !p256dh || !auth) {
    throw new NotificationApiError(
      "INVALID_SUBSCRIPTION",
      "브라우저 알림 구독 정보를 확인하지 못했어요.",
    );
  }

  return {
    endpoint: serialized.endpoint,
    keys: { p256dh, auth },
  };
}

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");

  let decoded: string;
  try {
    decoded = window.atob(base64);
  } catch {
    throw new NotificationApiError(
      "INVALID_VAPID_KEY",
      "서버의 알림 공개키 형식이 올바르지 않아요.",
    );
  }

  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes.buffer;
}

function assertWebPushSupported() {
  if (!isWebPushSupported()) {
    throw new NotificationApiError(
      "UNSUPPORTED",
      "이 브라우저에서는 푸시 알림을 사용할 수 없어요.",
    );
  }
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new NotificationApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestPush<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof NotificationApiError) throw error;
    throw new NotificationApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new NotificationApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "알림 설정 요청을 처리하지 못했습니다.",
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
