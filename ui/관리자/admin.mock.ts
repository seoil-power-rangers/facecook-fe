/**
 * 관리자 화면 목업. 서버가 붙기 전까지 쓰는 값이고 db/테이블/init.sql의
 * 컬럼 이름을 그대로 따른다.
 */

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalCooks: number;
  totalMatches: number;
  missionCleared: number;
  pendingReports: number;
}

export const adminStats: AdminStats = {
  totalUsers: 214,
  activeToday: 96,
  totalCooks: 487,
  totalMatches: 63,
  missionCleared: 21,
  pendingReports: 2,
};

/** mission_progress.current_step — 1~3은 진행 중, 4는 완주 */
export interface AdminMission {
  matchId: string;
  partnerA: string;
  partnerB: string;
  currentStep: number;
  matchedAt: string;
  lastCompletedAt: string | null;
}

/** 부스에서 인증받는 순서. ui/미션/MissionScreen.tsx와 문구를 맞춘다. */
export const MISSION_STEP_TITLES: Record<number, string> = {
  1: "둘이 함께 인증사진 찍기",
  2: "부스 미션 카드 뽑고 수행하기",
  3: "마지막 미션 수행하기",
};

export const MISSION_LAST_STEP = 3;

export const adminMissions: AdminMission[] = [
  {
    matchId: "1",
    partnerA: "유진",
    partnerB: "도윤",
    currentStep: 2,
    matchedAt: "09:41",
    lastCompletedAt: "09:58",
  },
  {
    matchId: "2",
    partnerA: "지효",
    partnerB: "민준",
    currentStep: 1,
    matchedAt: "10:12",
    lastCompletedAt: null,
  },
  {
    matchId: "3",
    partnerA: "서연",
    partnerB: "태현",
    currentStep: 4,
    matchedAt: "09:05",
    lastCompletedAt: "11:20",
  },
  {
    matchId: "4",
    partnerA: "하늘",
    partnerB: "재민",
    currentStep: 3,
    matchedAt: "10:44",
    lastCompletedAt: "11:02",
  },
];

/** report.status — pending은 미처리, reviewed는 처리 완료 */
export type AdminReportStatus = "pending" | "reviewed";

export interface AdminReportMessage {
  id: string;
  sender: "reporter" | "reported";
  content: string;
  sentAt: string;
}

export interface AdminReport {
  reportId: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  detail: string;
  status: AdminReportStatus;
  createdAt: string;
  /** 조치 결과. 처리 완료 건에만 있다. */
  action: "suspended" | "dismissed" | null;
  /**
   * 신고와 엮인 채팅방. 관리자는 이 방만 열 수 있다 —
   * 신고 없는 대화는 열람 대상이 아니다.
   */
  chatroomId: string | null;
  messages: AdminReportMessage[];
}

export const adminReports: AdminReport[] = [
  {
    reportId: "1",
    reporterName: "유진",
    reportedName: "현우",
    reason: "불쾌하거나 위협적인 행동",
    detail: "그만하라고 했는데 계속 만나자고 했어요.",
    status: "pending",
    createdAt: "11:32",
    action: null,
    chatroomId: "1",
    messages: [
      { id: "m1", sender: "reported", content: "지금 어디예요? 바로 갈게요", sentAt: "11:20" },
      { id: "m2", sender: "reporter", content: "오늘은 좀 어려울 것 같아요", sentAt: "11:22" },
      { id: "m3", sender: "reported", content: "왜요 어디냐고요", sentAt: "11:23" },
      { id: "m4", sender: "reporter", content: "불편해서 그만할게요", sentAt: "11:26" },
    ],
  },
  {
    reportId: "2",
    reporterName: "민준",
    reportedName: "상혁",
    reason: "스팸·외부 홍보",
    detail: "계속 다른 오픈채팅방 링크를 보냅니다.",
    status: "pending",
    createdAt: "10:47",
    action: null,
    chatroomId: "2",
    messages: [
      { id: "m1", sender: "reported", content: "혹시 이 방 들어와보실래요?", sentAt: "10:40" },
      { id: "m2", sender: "reported", content: "링크 보냈어요 확인 부탁드려요", sentAt: "10:41" },
      { id: "m3", sender: "reporter", content: "이런 건 좀 아닌 것 같아요", sentAt: "10:45" },
    ],
  },
  {
    reportId: "3",
    reporterName: "서연",
    reportedName: "지훈",
    reason: "사칭·허위 정보",
    detail: "프로필 학과가 실제와 다릅니다.",
    status: "reviewed",
    createdAt: "09:15",
    action: "dismissed",
    chatroomId: null,
    messages: [],
  },
];
