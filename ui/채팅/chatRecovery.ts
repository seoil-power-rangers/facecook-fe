/**
 * 채팅 이력 "대조" 알고리즘 — 실시간 구독이 놓친 메시지를 찾아 채운다.
 *
 * 저장 후 Redis 발행이 실패하거나 연결이 잠깐 끊겨도 서버는 조용히 성공(ACK)한다
 * (facecook-be#84). 그 순간 못 받은 메시지는 화면을 다시 열기 전까지 나타나지
 * 않으므로, 연결 재수립·화면 가시성 복귀·화면이 열려 있는 동안의 주기적 간격마다
 * 이 함수로 다시 대조한다(facecook-fe#87).
 *
 * 메시지 ID는 커밋 순서를 보장하지 않는다(IDENTITY, 개별 저장) — 더 작은 ID가
 * 더 늦게 커밋될 수 있다. "마지막으로 확인한 ID 이후"만 보는 방식으로는 그 사이에
 * 뒤늦게 커밋된 작은 ID를 놓친다. 대신 매번 최신 페이지부터 `before` 페이지를
 * 이어 읽어 현재 화면에 로딩된 가장 오래된 메시지(`oldestLoadedId`)까지 다시
 * 내려가며 훑는다.
 *
 * 예: 로컬에 100까지 있고 101만 누락된 채 102~151을 실시간으로 이미 받았다면,
 * 최신 50건(102~151)만 봐서는 101을 못 찾는다. 그 페이지가 꽉 찼으면(더 있을 수
 * 있다는 뜻) 이어서 그 앞 페이지(52~101)를 읽어야 101이 걸린다.
 *
 * `@ui` 별칭이나 React 없이 순수하게 테스트되려면(`ui/공통/liveBadgesCore.ts`와
 * 같은 패턴) `chatApi.ts`(별칭 import 있음)의 타입을 그대로 쓰면 안 되므로,
 * 필요한 최소 모양만 `RecoverableMessage`로 좁혀 둔다.
 */

export interface RecoverableMessage {
  messageId: number;
}

export interface ReconcileHistoryOptions<T extends RecoverableMessage> {
  /** `before`가 없으면 최신 페이지, 있으면 그 ID보다 오래된 페이지를 반환한다. */
  fetchPage: (before: number | undefined) => Promise<T[]>;
  /** 현재 화면에 로딩된 가장 오래된 메시지 ID. 없으면(대화 진입 직후 등) null. */
  oldestLoadedId: number | null;
  /** 한 페이지 크기 — 이보다 적게 오면 더 이어질 페이지가 없다는 뜻으로 본다. */
  pageSize: number;
  /** 안전장치: 한 번의 대조에서 읽을 최대 페이지 수. */
  maxPages?: number;
  /** true를 반환하면 다음 페이지를 요청하지 않고 지금까지 모은 것만 돌려준다(화면 이탈 등). */
  isCancelled?: () => boolean;
}

export const DEFAULT_RECONCILE_MAX_PAGES = 20;

export async function reconcileHistory<T extends RecoverableMessage>({
  fetchPage,
  oldestLoadedId,
  pageSize,
  maxPages = DEFAULT_RECONCILE_MAX_PAGES,
  isCancelled = () => false,
}: ReconcileHistoryOptions<T>): Promise<T[]> {
  const collected: T[] = [];
  let cursor: number | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    if (isCancelled()) break;
    const items = await fetchPage(cursor);
    if (isCancelled() || items.length === 0) break;

    collected.push(...items);
    const pageOldestId = Math.min(...items.map((item) => item.messageId));
    const reachedLoadedBoundary = oldestLoadedId !== null && pageOldestId <= oldestLoadedId;
    const reachedConversationStart = items.length < pageSize;
    if (reachedLoadedBoundary || reachedConversationStart) break;

    cursor = pageOldestId;
  }

  return collected;
}
