import { redirectToLoginOnSignOut } from "@ui/공통/authSession";
import type { ProfileResponse } from "@ui/프로필작성/profileApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type CookStatus = "pending" | "matched" | "expired";

export interface CookItemResponse {
  cookId: number;
  userId: number;
  profile: ProfileResponse;
  status: CookStatus;
  sentAt: string;
  matchId: number | null;
}

export interface CookUsageResponse {
  todayUsed: number;
  dailyLimit: number;
  totalUsed: number;
}

export interface CookListResponse {
  sent: CookItemResponse[];
  received: CookItemResponse[];
  usage: CookUsageResponse;
}

export interface SendCookResponse {
  cookId: number;
  receiverId: number;
  status: CookStatus;
  sentAt: string;
  matched: boolean;
  matchId: number | null;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class CookApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CookApiError";
  }
}

const COOK_ERROR_MESSAGES: Record<string, string> = {
  SELF: "내 프로필에는 콕을 보낼 수 없어요.",
  NOT_FOUND: "콕을 보낼 상대를 찾을 수 없어요.",
  ALREADY_MATCHED: "이미 매칭된 상대예요.",
  DUPLICATE: "이미 콕을 보낸 상대예요.",
  DAILY_LIMIT: "오늘 콕을 다 썼어요.",
  EVENT_LIMIT: "지금은 콕 발송이 잠시 제한됐어요.",
  // 취소
  FORBIDDEN: "내가 보낸 콕만 취소할 수 있어요.",
  ALREADY_EXPIRED: "이미 만료된 콕이에요.",
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
};

export function cookErrorMessage(error: unknown) {
  if (error instanceof CookApiError) {
    return COOK_ERROR_MESSAGES[error.code] ?? error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getCooks() {
  return requestCook<CookListResponse>("/api/cooks");
}

export function sendCook(receiverId: number) {
  return requestCook<SendCookResponse>("/api/cooks", {
    method: "POST",
    body: JSON.stringify({ receiverId }),
  });
}

/**
 * 보낸 콕 취소. 아직 상대가 맞콕하지 않은(pending) 콕만 지울 수 있다.
 *
 * 취소해도 오늘 사용 횟수는 돌아오지 않는다 — 돌려주면 콕을 뿌렸다가
 * 회수하는 식으로 하루 제한을 우회할 수 있다.
 */
export function cancelCook(cookId: number) {
  return requestCook<void>(`/api/cooks/${cookId}`, { method: "DELETE" });
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new CookApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestCook<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof CookApiError) throw error;
    throw new CookApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    const code = payload.code ?? "UNKNOWN";
    const message = payload.message ?? "요청을 처리하지 못했습니다.";
    // profileApi와 같은 원칙: 이 화면의 요청이 401로 끊긴 것도 여기서
    // 바로 로그인 화면으로 보낸다(콕 조회·전송은 세션이 없으면 의미가 없다).
    if (response.status === 401 || code === "UNAUTHORIZED") {
      redirectToLoginOnSignOut(message);
    }
    throw new CookApiError(code, message);
  }

  return payload;
}
