import { parseServerTime } from "../공통/serverTime";

/**
 * 말풍선에 시각을 붙일지 정한다.
 *
 * 필요한 정보만 받는다. `DisplayMessage` 전체를 몰라도 되게 일부러 좁혀 뒀다 —
 * 이 모듈이 `@ui/...` 별칭이나 React 없이 순수하게 테스트되려면
 * (`ui/탐색/exploreSort.ts`와 같은 패턴) ChatScreen을 import하면 안 되기 때문이다.
 */
export interface GroupableMessage {
  senderId: number;
  sentAt: string;
}

/**
 * 같은 사람이 같은 분에 연달아 보낸 묶음의 마지막인지.
 *
 * 말풍선마다 시각을 달면 같은 분에 보낸 메시지가 "14:32 / 14:32 / 14:32"로 세 번
 * 반복된다. 카카오톡처럼 묶음의 마지막에만 남겨서 시각이 실제로 바뀌는 자리를
 * 알아볼 수 있게 한다.
 *
 * 분 단위로 묶는 이유는 화면이 분까지만 보여주기 때문이다 — 14:32:10과 14:32:50은
 * 어차피 같은 글자로 나오므로 둘 다 달아둘 이유가 없다.
 *
 * 시각은 parseServerTime으로 읽는다. 서버는 오프셋 없는 KST로 보내고 방금 보낸
 * 메시지는 브라우저가 만든 "...Z"라, 둘을 Date.parse로 섞어 읽으면 기기 시간대에
 * 따라 아홉 시간이 어긋나 엉뚱하게 묶인다.
 *
 * 시각을 읽을 수 없는 값이면 묶지 않는다. 묶었다가 엉뚱한 메시지의 시각이 사라지는
 * 것보다, 한 번 더 보이는 쪽이 덜 나쁘다.
 *
 * 전제조건: `next`는 `current` 바로 다음 메시지이거나, 마지막이면 undefined다.
 *
 * 부작용: 없다.
 */
export function endsTimeGroup(
  current: GroupableMessage,
  next: GroupableMessage | undefined,
): boolean {
  if (!next) return true;
  if (next.senderId !== current.senderId) return true;

  const currentMinute = minuteOf(current.sentAt);
  const nextMinute = minuteOf(next.sentAt);
  if (currentMinute === null || nextMinute === null) return true;

  return currentMinute !== nextMinute;
}

function minuteOf(value: string): number | null {
  const at = parseServerTime(value);
  if (Number.isNaN(at)) return null;
  return Math.floor(at / 60_000);
}
