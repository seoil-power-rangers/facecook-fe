import { EVENT } from "@ui/공통/constants";

/**
 * 종료 화면의 운영진 인사말(facecook-fe#127). 문안이 확정되면 이 파일만 고친다.
 */
export const ENDING_MESSAGE = {
  title: `${EVENT.name}가 종료되었어요`,
  paragraphs: [
    `제52회 용마대동제 ${EVENT.period}, ${EVENT.name}를 이용해 주셔서 고맙습니다.`,
    "여러분이 주고받은 콕 하나하나 덕분에 부스가 더 따뜻했어요.",
    `참가자 정보와 대화 기록은 ${EVENT.purgeDay}에 모두 삭제돼요.`,
  ],
  signature: `${EVENT.name} 운영진 드림`,
} as const;

/** 후기 글자 수 제한. BE `feedback.content` 컬럼 길이와 같다. */
export const FEEDBACK_MAX_LENGTH = 1000;
