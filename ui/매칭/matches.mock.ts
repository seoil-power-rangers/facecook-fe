import type { ChatItem, Presence } from "@ui/채팅/ChatScreen";

export interface MatchRoom {
  id: string;
  name: string;
  mbti: string;
  department: string;
  bgColor: string;
  presence: Presence;
  sharedInterests: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  messages: ChatItem[];
}

export const matchRooms: MatchRoom[] = [
  {
    id: "1",
    name: "유진",
    mbti: "ISFP",
    department: "화학과",
    bgColor: "#F59E0B",
    presence: { kind: "online" },
    sharedInterests: ["클라이밍", "사진", "조용한 카페"],
    lastMessage: "좋아요 내일 봐요!",
    lastMessageAt: "방금",
    messages: [
      { kind: "system", id: "s1", text: "오늘 09:41 · 매칭됨" },
      {
        kind: "mission",
        id: "m1",
        step: 1,
        title: "둘이 함께 인증사진 찍기",
        description: "총학생회 부스에서 인증받으세요. 관리자 확인 후 STEP 2가 열려요.",
      },
      { kind: "message", id: "c1", from: "other", text: "안녕하세요! 콕 보고 반가웠어요" },
      { kind: "message", id: "c2", from: "other", text: "미션 사진 지금 찍으러 갈까요?" },
      { kind: "message", id: "c3", from: "me", text: "좋아요! 부스 앞에서 봐요!" },
      { kind: "divider", id: "d1", label: "일요일 · 09:44" },
      { kind: "message", id: "c4", from: "me", text: "10분이면 도착할 것 같아요" },
      { kind: "message", id: "c5", from: "other", text: "네 천천히 오세요" },
      { kind: "message", id: "c6", from: "other", text: "오늘 미션 사진 잘 나왔어요" },
      { kind: "message", id: "c7", from: "me", text: "ㅋㅋ 저도 마음에 들어요" },
      { kind: "message", id: "c8", from: "other", text: "내일도 부스에서 봬요" },
      { kind: "message", id: "c9", from: "me", text: "좋아요 내일 봐요!" },
    ],
  },
  {
    id: "2",
    name: "민서",
    mbti: "INTJ",
    department: "물리학과",
    bgColor: "#22C55E",
    presence: { kind: "lastActive", minutesAgo: 12 },
    sharedInterests: ["보드게임", "커피"],
    lastMessage: "네 알겠습니다!",
    lastMessageAt: "1시간 전",
    unreadCount: 1,
    messages: [
      { kind: "system", id: "s1", text: "오늘 10:20 · 매칭됨" },
      { kind: "message", id: "c1", from: "other", text: "안녕하세요, 반가워요!" },
      { kind: "message", id: "c2", from: "me", text: "안녕하세요! 반갑습니다" },
      { kind: "message", id: "c3", from: "other", text: "이따 미션 같이 하실래요?" },
      { kind: "message", id: "c4", from: "me", text: "네 알겠습니다!" },
    ],
  },
  {
    id: "3",
    name: "도윤",
    mbti: "ESTJ",
    department: "경제학과",
    bgColor: "#EF4444",
    presence: { kind: "away" },
    sharedInterests: ["농구", "여행"],
    lastMessage: "아직 메시지가 없어요",
    lastMessageAt: "방금",
    messages: [{ kind: "system", id: "s1", text: "방금 · 매칭됨" }],
  },
];
