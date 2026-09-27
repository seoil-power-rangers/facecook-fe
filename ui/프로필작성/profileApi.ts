import { redirectToLoginOnSignOut } from "@ui/공통/authSession";
import { createSharedRequest } from "@ui/공통/sharedRequestCore";
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
  /** 마지막 활동 시각. 기능명세 2절의 "현재 활동 중 표시" 참고용으로 함께 내려온다(항상 온다 — 활동 기록이 없으면 null). */
  lastActiveAt: string | null;
  /**
   * 서버가 판단한 "지금 활동 중"이다(활동 창 설정, 기본 15분). FE는 별도 기준(예: 5분)으로
   * 다시 계산하지 않는다 — 관리자 통계의 활동 유저 기준과는 일부러 다르며 그건 이 값이
   * 대상이 아니다.
   */
  isActive: boolean;
}

/** 서버가 내려준 활동 중 여부를 그대로 읽는다. */
export function isActiveNow(profile: ProfileResponse) {
  return profile.isActive;
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

export async function createProfile(request: CreateProfileRequest) {
  const profile = await requestProfile<ProfileResponse>("/api/profile", {
    method: "POST",
    body: JSON.stringify(request),
  });
  myProfile.set(profile);
  return profile;
}

/**
 * 내 프로필을 보관하는 시간. 화면을 옮길 때마다 진입 가드(RequireProfile)와 화면 본문이 같은 값을 부르는데,
 * 그 사이에 바뀌는 값은 내가 직접 고친 것뿐이고 그건 수정 응답으로 바로 바뀐다(updateMyProfile).
 */
const MY_PROFILE_MAX_AGE_MS = 30_000;

/**
 * 내 프로필은 참가자 화면마다 진입 가드와 화면이 함께 부른다. 따로 부르면 화면을 옮길 때마다 같은 요청이
 * 두 번씩 나간다(facecook-fe#103: 홈·알림·탐색·채팅방·마이). 같은 순간의 요청은 하나로 합치고, 받은 값은
 * 잠깐 보관해 탭을 오가도 다시 받지 않는다. 실패는 보관하지 않는다 — 로그인이 풀린 경우는 지금처럼 각 API
 * 래퍼가 로그인 화면으로 보낸다(authSession).
 */
const myProfile = createSharedRequest<ProfileResponse>({
  fetch: () => requestProfile<ProfileResponse>("/api/profile"),
  maxAgeMs: MY_PROFILE_MAX_AGE_MS,
});

/** 내 프로필. 보관한 값이 새것이면 요청하지 않고, 이미 나간 요청이 있으면 그 응답을 함께 쓴다. */
export function getMyProfile() {
  return myProfile.get();
}

/**
 * 보관한 내 프로필을 버린다. 로그인·로그아웃·세션 만료처럼 계정이 바뀔 때 부른다(session.ts) — 버리지 않으면
 * 같은 폰으로 들어온 다음 사람의 화면에 이전 사람의 프로필이 보관 시간 동안 나온다.
 */
export function clearMyProfileCache() {
  myProfile.clear();
}

export async function updateMyProfile(request: UpdateProfileRequest) {
  const profile = await requestProfile<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
  myProfile.set(profile);
  return profile;
}

export function getProfiles() {
  return requestProfile<ProfileResponse[]>("/api/profiles");
}

/** `GET /api/stats` 응답. total은 프로필이 있는 참가자 전체 수(나 포함), activeNow는 최근 활동 중인 수다. */
export interface ProfileStatsResponse {
  total: number;
  activeNow: number;
}

/** 참가자 수만 필요할 때 쓴다 — 전체 목록(`getProfiles`)을 받아 세지 않는다. */
export function getProfileStats() {
  return requestProfile<ProfileStatsResponse>("/api/stats");
}

export function getProfile(userId: number) {
  return requestProfile<ProfileResponse>(`/api/profiles/${userId}`);
}

export interface DepartmentGroup {
  college: string;
  majors: string[];
}

/**
 * 학과 목록. 정본은 백엔드다 — FE는 하드코딩하지 않고 받아온다.
 *
 * 목록은 백엔드 코드에 고정돼 있어(DepartmentCatalog) 백엔드를 다시 배포하기 전에는 바뀌지 않는다. 그래서 한 번
 * 받으면 페이지를 새로고침하기 전까지 계속 쓴다 — 탐색에 들어갈 때마다, 학과 선택기를 열 때마다 다시 받던 것을
 * 없앤다(facecook-fe#109). 실패는 보관하지 않아 다음에 다시 받는다.
 */
const departments = createSharedRequest<DepartmentGroup[]>({
  fetch: () => requestProfile<DepartmentGroup[]>("/api/departments"),
  maxAgeMs: Number.POSITIVE_INFINITY,
});

export function getDepartments() {
  return departments.get();
}

interface PhotoUploadUrlResponse {
  uploadUrl: string;
  photoUrl: string;
}

/** 백엔드가 실제로 허용하는 형식·용량과 맞춰둔다(불일치하면 업로드 URL만 받고 S3가 거절한다). */
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** 올리기 전에 먼저 걸러서, 어차피 실패할 파일 때문에 업로드 URL 발급까지 쓰지 않는다. */
export function photoFileError(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return "jpg, png, webp 파일만 올릴 수 있어요.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "사진 용량은 10MB를 넘을 수 없어요.";
  }
  return null;
}

/**
 * 프로필 사진 한 장을 S3에 올리고, 프로필에 저장할 최종 URL을 돌려준다.
 *
 * presigned URL로 올리는 PUT은 우리 백엔드가 아니라 S3로 직접 나가는
 * 요청이라 requestProfile(JSON 전용, credentials 포함)을 쓰지 않는다.
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const validationError = photoFileError(file);
  if (validationError) {
    throw new ProfileApiError("VALIDATION", validationError);
  }

  const { uploadUrl, photoUrl } = await requestProfile<PhotoUploadUrlResponse>(
    "/api/profile/photo/upload-url",
    { method: "POST", body: JSON.stringify({ contentType: file.type }) },
  );

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
  } catch {
    throw new ProfileApiError("NETWORK", "사진 업로드에 실패했어요. 다시 시도해주세요.");
  }

  if (!response.ok) {
    throw new ProfileApiError("PHOTO_UPLOAD_FAILED", "사진 업로드에 실패했어요. 다시 시도해주세요.");
  }

  return photoUrl;
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
      redirectToLoginOnSignOut(apiError.message, apiError.code);
    }
    throw apiError;
  }

  return payload;
}
