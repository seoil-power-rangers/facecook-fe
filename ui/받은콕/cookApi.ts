import { redirectToLoginOnSignOut } from "@ui/공통/authSession";
import type { ProfileResponse } from "@ui/프로필작성/profileApi";
import { buildRequestHeaders } from "./requestHeaders";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

/**
 * `rejected`는 거절당한 사람의 "보낸 콕" 목록에만 나타난다(거절한 사람의 받은 목록에서는 서버가 뺀다).
 * `expired`는 1시간 만료가 있던 때 남은 레거시 값이다. BE가 EXPIRED를 제거하기 전까지 유지한다.
 */
export type CookStatus = "pending" | "matched" | "rejected" | "expired";

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
  ALREADY_REJECTED: "이미 거절한 상대예요.",
  DAILY_LIMIT: "오늘 콕을 다 썼어요.",
  EVENT_LIMIT: "지금은 콕 발송이 잠시 제한됐어요.",
  // 취소
  FORBIDDEN: "내가 보낸 콕만 취소할 수 있어요.",
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
};

/**
 * 로그에 남길 실패 사유. 화면에 띄우는 문구(cookErrorMessage)와 달리 코드
 * 그대로 남긴다 — 문구는 바뀌어도 지표가 흔들리면 안 된다.
 */
export function cookErrorCode(error: unknown) {
  return error instanceof CookApiError ? error.code : "NETWORK";
}

export function cookErrorMessage(error: unknown) {
  if (error instanceof CookApiError) {
    return COOK_ERROR_MESSAGES[error.code] ?? error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

/**
 * 거절 요청 실패 문구. 콕 보내기·취소용 문구(cookErrorMessage)를 그대로 쓰면 "콕을 보낼 상대를 찾을 수
 * 없어요"처럼 다른 작업의 말이 나오므로 거절만 따로 둔다.
 *
 * `NOT_FOUND`는 보낸 사람이 먼저 취소한 경우뿐 아니라 서버의 거절 기능이 아직 꺼져 있을 때도 온다. 어느
 * 쪽인지 이 응답만으로는 알 수 없어서, 화면이 목록을 다시 불러온 결과로 확인하게 한다.
 */
export function rejectErrorMessage(error: unknown) {
  if (!(error instanceof CookApiError)) return NETWORK_REJECT_MESSAGE;
  return REJECT_ERROR_MESSAGES[error.code] ?? "콕을 거절하지 못했어요. 잠시 후 다시 시도해주세요.";
}

const NETWORK_REJECT_MESSAGE = "연결이 불안정해요. 목록을 다시 확인하고 있어요.";

const REJECT_ERROR_MESSAGES: Record<string, string> = {
  // requestCook이 fetch 실패를 CookApiError("NETWORK")로 바꿔서 던진다.
  NETWORK: NETWORK_REJECT_MESSAGE,
  NOT_FOUND: "거절하지 못했어요. 목록을 새로 불러왔어요.",
  ALREADY_MATCHED: "이미 매칭된 콕이에요.",
  ALREADY_EXPIRED: "이미 만료된 콕이에요.",
  FORBIDDEN: "내가 받은 콕만 거절할 수 있어요.",
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
};

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

/**
 * 받은 콕 거절. 성공하면 서버가 그 콕을 거절 상태로 바꾸고, 거절한 사람의 받은 콕 목록에서 뺀다.
 *
 * `X-Cook-Reject-Contract: 1` 헤더가 있어야 서버가 거절을 기록한다. 이 헤더가 없거나 서버의 거절 기능이
 * 꺼져 있으면 404(`NOT_FOUND`)가 온다 — 이전 버전 화면이 보낸 요청과 구분하기 위한 계약이다
 * (facecook-be#74).
 *
 * 되돌리는 길은 두지 않는다. 누르기 전에 시트로 한 번 확인받는다.
 *
 * 전제조건: 내가 받은 콕이다. 이미 거절한 콕을 다시 거절해도 성공한다.
 *
 * 예외: `CookApiError`(`NOT_FOUND`: 없거나 이미 취소된 콕 또는 기능 꺼짐, `ALREADY_MATCHED`,
 * `ALREADY_EXPIRED`, `FORBIDDEN`), 연결 실패는 `NETWORK`.
 */
export function rejectCook(cookId: number) {
  return requestCook<void>(`/api/cooks/${cookId}/reject`, {
    method: "POST",
    headers: { [REJECT_CONTRACT_HEADER]: REJECT_CONTRACT_VERSION },
  });
}

const REJECT_CONTRACT_HEADER = "X-Cook-Reject-Contract";
const REJECT_CONTRACT_VERSION = "1";

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
      headers: buildRequestHeaders(init.headers, Boolean(init.body)),
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
      redirectToLoginOnSignOut(message, code);
    }
    throw new CookApiError(code, message);
  }

  return payload;
}
