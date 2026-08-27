/**
 * DB 스키마(db/테이블/init.sql)를 그대로 옮긴 타입.
 * 서버가 붙기 전까지 목업 데이터가 이 모양을 따른다.
 */

export type Role = "participant" | "admin";
export type UserStatus = "active" | "suspended";
export type CookStatus = "pending" | "matched" | "expired";
export type ReportStatus = "pending" | "reviewed";

export interface User {
  userId: number;
  email: string;
  role: Role;
  status: UserStatus;
  agreedPrivacyAt: string | null;
  agreedTermsAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface Profile {
  profileId: number;
  userId: number;
  nickname: string;
  gender: string;
  age: number;
  mbti: string;
  /** DB는 단일 컬럼이라 다중 선택을 쉼표로 이어 붙인다. */
  hobby: string;
  bloodType: string;
  department: string | null;
  grade: string | null;
  bio: string | null;
  photoUrl: string | null;
  idealType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Cook {
  cookId: number;
  senderId: number;
  receiverId: number;
  matchId: number | null;
  status: CookStatus;
  sentAt: string;
}

export interface Match {
  matchId: number;
  userAId: number;
  userBId: number;
  matchedAt: string;
}

export interface ChatRoom {
  chatroomId: number;
  matchId: number;
  createdAt: string;
}

export interface Message {
  messageId: number;
  chatroomId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

export interface MissionProgress {
  missionProgressId: number;
  matchId: number;
  /** 1 / 2 / 3 / 4(전체 완료) */
  currentStep: number;
  step1CompletedAt: string | null;
  step1CompletedBy: number | null;
  step2CompletedAt: string | null;
  step2CompletedBy: number | null;
  step3CompletedAt: string | null;
  step3CompletedBy: number | null;
}

export interface Report {
  reportId: number;
  reporterId: number;
  reportedUserId: number;
  reason: string;
  status: ReportStatus;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

/**
 * 온보딩 02~07에서 모으는 입력값.
 * 07의 [완료하고 시작]을 누를 때 User + Profile로 만들어 보낸다.
 *
 * traits(성향 태그)는 시안에는 있지만 DB에 컬럼이 없다 — DB 담당자에게 요청해 둔 상태라
 * 지금은 화면 안에서만 들고 있는다.
 */
export interface OnboardingDraft {
  email: string;
  agreedTerms: string[];
  nickname: string;
  gender: string;
  age: string;
  bloodType: string;
  mbti: string[];
  traits: string[];
  activities: string[];
  photoUrl: string;
  department: string;
  grade: string;
  bio: string;
  idealType: string;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  email: "",
  agreedTerms: [],
  nickname: "",
  gender: "",
  age: "",
  bloodType: "",
  mbti: [],
  traits: [],
  activities: [],
  photoUrl: "",
  department: "",
  grade: "",
  bio: "",
  idealType: "",
};
