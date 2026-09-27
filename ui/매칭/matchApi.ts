import type { ProfileResponse } from "@ui/프로필작성/profileApi";
import { createSharedRequest, type SharedRequest } from "@ui/공통/sharedRequestCore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export interface RecentMessageResponse {
  senderId: number;
  content: string;
  sentAt: string;
}

export interface MatchResponse {
  matchId: number;
  matchedAt: string;
  partner: ProfileResponse;
  recentMessage: RecentMessageResponse | null;
  /**
   * 안 읽은 메시지 수. 아직 서버가 주지 않아서, 없으면 브라우저에 남긴
   * 마지막 열람 시각으로 대신 판단한다(readState.ts).
   */
  unreadCount?: number;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class MatchApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MatchApiError";
  }
}

export function matchErrorMessage(error: unknown) {
  if (error instanceof MatchApiError) return error.message;
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getMatches() {
  return requestMatch<MatchResponse[]>("/api/matches");
}

/**
 * 매칭 정보를 보관하는 시간. 채팅 → 미션 → 뒤로(채팅)처럼 같은 매칭 화면을 오갈 때마다 다시 받던 것을
 * 없앤다(facecook-fe#111). 매칭 정보(상대 프로필 등)는 거의 바뀌지 않아 이 정도 늦어도 문제없다.
 */
const MATCH_DETAIL_MAX_AGE_MS = 30_000;

/** 매칭별 "한 번 받아 나눠 쓰기". 방문한 매칭 수만큼만 쌓인다. */
const matchDetails = new Map<number, SharedRequest<MatchResponse>>();

/**
 * 매칭 하나의 정보. 같은 매칭을 같은 순간 여러 곳이 불러도 요청은 하나이고, 받은 값은 잠깐 보관해 다시 받지
 * 않는다. 실패는 보관하지 않는다.
 *
 * 미션 진행(getMissionProgress)과 채팅 메시지는 여기에 넣지 않는다 — 화면을 떠난 사이 바뀔 수 있고 채팅
 * 화면은 미션 진행을 실시간으로 받지 않아서, 보관하면 옛 값이 보인다.
 */
export function getMatch(matchId: number) {
  let detail = matchDetails.get(matchId);
  if (!detail) {
    detail = createSharedRequest<MatchResponse>({
      fetch: () => requestMatch<MatchResponse>(`/api/matches/${matchId}`),
      maxAgeMs: MATCH_DETAIL_MAX_AGE_MS,
    });
    matchDetails.set(matchId, detail);
  }
  return detail.get();
}

/** 보관한 매칭 정보를 모두 버린다. 계정이 바뀔 때 부른다(session.ts). */
export function clearMatchDetailCache() {
  for (const detail of matchDetails.values()) detail.clear();
  matchDetails.clear();
}

/** 채팅방을 읽었다고 서버에 알린다. 들어올 때와 나갈 때 모두 호출한다. */
export function markMatchRead(matchId: number) {
  return requestMatch<void>(`/api/matches/${matchId}/read`, { method: "PATCH" });
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new MatchApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestMatch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof MatchApiError) throw error;
    throw new MatchApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    throw new MatchApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
    );
  }

  return payload;
}
