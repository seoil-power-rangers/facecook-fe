import { redirectToLoginOnSignOut } from "@ui/공통/authSession";
import type { OnboardingDraft } from "@ui/공통/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export interface CreateProfileRequest {
  nickname: string;
  gender: string;
  age: number;
  mbti: string;
  hobby: string;
  bloodType: string;
  department?: string;
  grade?: string;
  bio?: string;
  idealType?: string;
  /** 백엔드는 업로드 파일이 아니라 URL 문자열만 받는다. */
  photo?: string;
}

export interface UpdateProfileRequest {
  department?: string;
  grade?: string;
  bio?: string;
  /** 백엔드는 업로드 파일이 아니라 URL 문자열만 받는다. */
  photo?: string;
}

export interface ProfileResponse {
  userId: number;
  nickname: string;
  gender: string;
  age: number;
  mbti: string;
  hobby: string;
  bloodType: string;
  department: string | null;
  grade: string | null;
  bio: string | null;
  idealType: string | null;
  photo: string | null;
  /**
   * 마지막 활동 시각. 기능명세 2절의 "현재 활동 중 표시"에 쓰는 값인데
   * 아직 서버가 내려주지 않는다. 없으면 활동 중 표시를 띄우지 않는다.
   */
  lastActiveAt?: string | null;
}

/** 5분 안에 움직였으면 지금 보고 있는 것으로 친다. */
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export function isActiveNow(profile: ProfileResponse) {
  if (!profile.lastActiveAt) return false;
  const at = Date.parse(profile.lastActiveAt);
  return !Number.isNaN(at) && Date.now() - at < ACTIVE_WINDOW_MS;
}

/** 로그인이 풀렸거나 정지된 계정인지. 화면을 보여주면 안 되는 상태다. */
export function isSignedOut(error: unknown) {
  return (
    error instanceof ProfileApiError &&
    (error.status === 401 ||
      error.code === "UNAUTHORIZED" ||
      error.code === "SUSPENDED")
  );
}

export class ProfileApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    /** HTTP 응답 코드. 401 본문이 비어 있을 수 있어 code만으로 판단하지 않는다. */
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProfileApiError";
  }
}

export function profileErrorMessage(error: unknown) {
  if (error instanceof ProfileApiError) {
    return error.message;
  }
  return "백엔드 서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.";
}

export function createProfileRequestFromDraft(
  draft: OnboardingDraft,
): CreateProfileRequest {
  return {
    nickname: draft.nickname.trim(),
    gender: draft.gender,
    age: Number(draft.age),
    mbti: draft.mbti.join(""),
    hobby: draft.activities.join(","),
    bloodType: draft.bloodType,
    ...optionalField("department", draft.department),
    ...optionalField("grade", draft.grade),
    ...optionalField("bio", draft.bio),
    ...optionalField("idealType", draft.idealType),
    ...optionalField("photo", draft.photoUrl),
  };
}

export function createProfile(request: CreateProfileRequest) {
  return requestProfile<ProfileResponse>("/api/profile", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getMyProfile() {
  return requestProfile<ProfileResponse>("/api/profile");
}

export function updateMyProfile(request: UpdateProfileRequest) {
  return requestProfile<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

export function getProfiles() {
  return requestProfile<ProfileResponse[]>("/api/profiles");
}

export function getProfile(userId: number) {
  return requestProfile<ProfileResponse>(`/api/profiles/${userId}`);
}

function optionalField<K extends string>(key: K, value: string) {
  const trimmed = value.trim();
  return trimmed ? ({ [key]: trimmed } as Record<K, string>) : {};
}

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ProfileApiError(
      "MISSING_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }
  return API_BASE_URL;
}

async function requestProfile<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${requireApiBaseUrl()}${path}`, {
      ...init,
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof ProfileApiError) {
      throw error;
    }
    throw new ProfileApiError("NETWORK", "백엔드 서버에 연결할 수 없습니다.");
  }

  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorResponse;

  if (!response.ok) {
    const apiError = new ProfileApiError(
      payload.code ?? "UNKNOWN",
      payload.message ?? "요청을 처리하지 못했습니다.",
      response.status,
    );
    // 어느 화면의 요청이든 여기 한 곳을 거치므로, 로그인 화면이 아닌
    // 최초 진입 시점에 세션이 끊긴 것도 여기서 바로 잡아낸다.
    if (isSignedOut(apiError)) {
      redirectToLoginOnSignOut(apiError.message);
    }
    throw apiError;
  }

  return payload;
}
