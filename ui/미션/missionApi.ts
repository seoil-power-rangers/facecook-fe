const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export interface MissionProgressResponse {
  matchId: number;
  /** 1~3은 현재 진행 단계, 4는 모든 미션 완료를 뜻한다. */
  currentStep: number;
  step1CompletedAt: string | null;
  step2CompletedAt: string | null;
  step3CompletedAt: string | null;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class MissionApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MissionApiError";
  }
}

const MISSION_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "로그인이 만료됐어요. 다시 로그인해주세요.",
  FORBIDDEN: "이 매칭의 미션을 볼 수 없어요.",
  NOT_FOUND: "미션 정보를 찾을 수 없어요.",
};

export function missionErrorMessage(error: unknown) {
  if (error instanceof MissionApiError) {
    return MISSION_ERROR_MESSAGES[error.code] ?? error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function getMissionProgress(matchId: number) {
  return requestMission<MissionProgressResponse>(
    `/api/matches/${matchId}/mission`,
  );
}

function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new MissionApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestMission<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof MissionApiError) throw error;
    throw new MissionApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    throw new MissionApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
    );
  }

  return payload;
}
