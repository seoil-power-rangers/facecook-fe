import { createApiRequest } from "@ui/공통/apiClient";
import { parseMissionProgress } from "./missionModel";

export type { MissionProgressResponse } from "./missionModel";

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

export async function getMissionProgress(matchId: number) {
  const payload = await requestMission<unknown>(`/api/matches/${matchId}/mission`);
  try {
    return parseMissionProgress(payload);
  } catch (error) {
    throw new MissionApiError(
      "INVALID_RESPONSE",
      error instanceof Error ? error.message : "미션 응답을 읽지 못했습니다.",
    );
  }
}

const requestMission = createApiRequest({
  makeError: (code, message) => new MissionApiError(code, message),
});
