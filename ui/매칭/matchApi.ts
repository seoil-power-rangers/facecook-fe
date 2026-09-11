import type { ProfileResponse } from "@ui/프로필작성/profileApi";

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

export function getMatch(matchId: number) {
  return requestMatch<MatchResponse>(`/api/matches/${matchId}`);
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

async function requestMatch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof MatchApiError) throw error;
    throw new MatchApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
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
