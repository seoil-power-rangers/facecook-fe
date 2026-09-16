export interface CurrentMission {
  step: number;
  title: string;
  description: string | null;
}

export interface MissionProgressResponse {
  matchId: number;
  /** 1~3은 현재 진행 단계, 4는 모든 미션 완료를 뜻한다. */
  currentStep: number;
  step1CompletedAt: string | null;
  step2CompletedAt: string | null;
  step3CompletedAt: string | null;
  currentMission: CurrentMission | null;
}

/**
 * 백엔드 currentMission DTO의 필드명이 확정되기 전까지 흔히 쓰는 이름을
 * 허용하되, 화면 내부에서는 하나의 안정된 형태만 사용한다.
 */
export function parseMissionProgress(value: unknown): MissionProgressResponse {
  if (!isRecord(value)) throw new Error("미션 응답 형식이 올바르지 않습니다.");

  const matchId = asPositiveInteger(value.matchId);
  const currentStep = asInteger(value.currentStep);
  if (matchId === null || currentStep === null || currentStep < 1 || currentStep > 4) {
    throw new Error("미션 진행 단계가 올바르지 않습니다.");
  }

  const currentMission =
    currentStep > 3 ? null : parseCurrentMission(value.currentMission, currentStep);

  return {
    matchId,
    currentStep,
    step1CompletedAt: nullableString(value.step1CompletedAt),
    step2CompletedAt: nullableString(value.step2CompletedAt),
    step3CompletedAt: nullableString(value.step3CompletedAt),
    currentMission,
  };
}

function parseCurrentMission(value: unknown, currentStep: number): CurrentMission | null {
  if (typeof value === "string" && value.trim()) {
    return {
      step: currentStep,
      title: value.trim(),
      description: null,
    };
  }
  if (!isRecord(value)) return null;

  const step = asInteger(value.step) ?? currentStep;
  const title = firstString(
    value.title,
    value.missionTitle,
    value.content,
    value.name,
    value.description,
  );
  const description = firstString(
    value.description,
    value.missionDescription,
    value.detail,
    value.guide,
    value.content,
  );
  if (!title) return null;

  return {
    step: step >= 1 && step <= 3 ? step : currentStep,
    title,
    description: description === title ? null : description,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function asPositiveInteger(value: unknown) {
  const number = asInteger(value);
  return number !== null && number > 0 ? number : null;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
