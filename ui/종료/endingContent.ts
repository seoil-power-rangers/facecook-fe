import { EVENT } from "@ui/공통/constants";

/**
 * 종료 화면의 개발진 인사말(facecook-fe#127). 문구를 바꿀 때는 이 파일만 고친다.
 */
export const ENDING_MESSAGE = {
  title: "콕 찔러보기가 종료되었습니다.",
  paragraphs: [
    "지금까지 서비스를 이용해 주셔서 감사합니다.",
    `참가자 정보와 대화 기록은 ${EVENT.purgeDay}에 모두 삭제됩니다.`,
  ],
  signature: "콕 찔러보기 개발진 드림",
} as const;

/** 후기 글자 수 제한. BE `feedback.content` 컬럼 길이와 같다. */
export const FEEDBACK_MAX_LENGTH = 1000;
