/** 온보딩 화면(03~06)에서 쓰는 선택지 모음. */

export const GENDERS = ["여성", "남성"] as const;

export const BLOOD_TYPES = ["A형", "B형", "O형", "AB형"] as const;

/** MBTI 4축. 시안에서 2행 4열로 배치된다(윗줄 E S T J / 아랫줄 I N F P). */
export const MBTI_AXES = [
  { top: { code: "E", label: "외향" }, bottom: { code: "I", label: "내향" } },
  { top: { code: "S", label: "감각" }, bottom: { code: "N", label: "직관" } },
  { top: { code: "T", label: "사고" }, bottom: { code: "F", label: "감정" } },
  { top: { code: "J", label: "계획" }, bottom: { code: "P", label: "즉흥" } },
] as const;

export const MBTI_NICKNAMES: Record<string, string> = {
  INTJ: "용의주도한 전략가",
  INTP: "논리적인 사색가",
  ENTJ: "대담한 통솔자",
  ENTP: "뜨거운 논쟁을 즐기는 변론가",
  INFJ: "선의의 옹호자",
  INFP: "열정적인 중재자",
  ENFJ: "정의로운 사회운동가",
  ENFP: "재기발랄한 활동가",
  ISTJ: "청렴결백한 논리주의자",
  ISFJ: "용감한 수호자",
  ESTJ: "엄격한 관리자",
  ESFJ: "사교적인 외교관",
  ISTP: "만능 재주꾼",
  ISFP: "호기심 많은 예술가",
  ESTP: "모험을 즐기는 사업가",
  ESFP: "자유로운 영혼의 연예인",
};

/** 04 하단 "나를 한마디로 표현하면?" — 최대 2개 */
export const TRAITS = [
  "저는 유쾌해요",
  "저는 다정해요",
  "저는 속깊어요",
  "저는 활발해요",
] as const;
export const TRAIT_MAX = 2;

/** 05 "이런 걸 하고 싶어요" — 3개 이상 */
export const ACTIVITIES = [
  "영화보기",
  "전시관람",
  "산책",
  "놀이공원",
  "술 한잔",
  "드라이브",
  "여행",
  "맛집탐방",
  "운동",
  "쇼핑",
  "보드게임",
  "독서",
] as const;
export const ACTIVITY_MIN = 3;

export const GRADES = ["1학년", "2학년", "3학년", "4학년"] as const;

/**
 * 자기소개 최대 글자 수. 온보딩(최초 등록)과 마이페이지(수정)가 각자
 * 상수를 따로 들고 있으면 어긋나기 쉬워서(실제로 한쪽이 60자로 더
 * 좁아진 적이 있다) 한 곳에서만 정한다.
 */
export const BIO_MAX = 100;

/** 약관 — 필수 2, 선택 1. 02 인증 화면 안에서 받는다. */
export const TERMS = [
  { id: "service", label: "서비스 이용약관", required: true },
  { id: "privacy", label: "개인정보 수집·이용 동의", required: true },
  { id: "photo", label: "프로필 사진 업로드 동의", required: false },
] as const;

/** 02 인증 */
export const CODE_LENGTH = 6;
export const CODE_TTL_SECONDS = 5 * 60;

/** 로그인 비밀번호 — 최초 가입 시 설정, 이후 로그인에 사용 */
export const MIN_PASSWORD_LENGTH = 8;

/** 온보딩 진행바 칸 수. 약관을 02에 합쳐 STEP 1~5가 됐다. */
export const PROGRESS_SLOTS = 5;

export const EVENT = {
  name: "콕찔러보기",
  period: "9/30 ~ 10/2",
  purgeAt: "10/3 00:00",
} as const;

/**
 * 콕/알림 배지를 다시 조회하는 주기. 화면을 벗어나지 않고 가만히 있어도
 * 이 주기로 갱신된다(탭이 보일 때만 — 백그라운드에서는 멈춘다).
 */
export const LIVE_BADGE_POLL_INTERVAL_MS = 5_000;
