/**
 * 알림 보관함 항목을 콕·매칭 응답에서 조합하는 순수 로직. React·API 호출·`@ui` 별칭이 없어서
 * 단위 테스트할 수 있다(scripts/run-tests.mjs 참고). 실제 응답 타입(CookListResponse,
 * MatchResponse)은 아래 최소 모양을 구조적으로 만족한다.
 */
import { parseServerTime } from "../공통/serverTime";
/**
 * 알림 보관함에 쌓이는 항목.
 *
 * 백엔드에 알림 목록 API가 없다(docs/API명세.md 8절은 푸시 구독/해제만 있다).
 * 그래서 이미 있는 콕·매칭 응답을 시간순으로 합쳐서 보관함을 만든다. 기능명세
 * 8절이 정한 알림 이벤트 세 가지와 같은 종류다 — 콕 받음, 매칭 성사, 메시지 도착.
 *
 * 서버가 알림 API를 내주면 이 파일의 buildFeed()만 바꾸면 된다.
 */
export type FeedKind = "cook" | "match" | "message";

export interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  body: string;
  /** ISO 문자열. 정렬과 "몇 분 전" 표시에 쓴다. */
  at: string;
  href: string;
}


/** 알림을 만드는 데 필요한 받은 콕의 최소 모양. */
export interface FeedCook {
  cookId: number;
  status: string;
  sentAt: string;
  profile: { nickname: string };
}

/** 알림을 만드는 데 필요한 매칭의 최소 모양. */
export interface FeedMatch {
  matchId: number;
  matchedAt: string;
  partner: { nickname: string };
  recentMessage: { senderId: number; content: string; sentAt: string } | null;
}

/**
 * 콕·매칭 응답을 시간순 알림으로 합친다.
 *
 * 받은 콕은 아직 답할 수 있는 `pending`과 매칭으로 이어진 `matched`만 알림이 된다. 거절되거나(서버가 받은
 * 목록에서 빼지만 방어적으로 제외한다) 만료된 콕은 맞콕할 수 없는데 "맞콕하면 바로 매칭돼요"라고 안내하게
 * 되므로 알림에 넣지 않는다.
 *
 * 부작용: 없다.
 */
export function buildFeedFromData(
  cooks: { received: FeedCook[] },
  matches: FeedMatch[],
  myUserId: number,
): FeedItem[] {
  const items: FeedItem[] = [];

  for (const cook of cooks.received) {
    if (cook.status !== "pending" && cook.status !== "matched") continue;
    items.push({
      id: `cook-${cook.cookId}`,
      kind: "cook",
      title: `${cook.profile.nickname}님이 콕을 보냈어요`,
      body: cook.status === "matched" ? "매칭으로 이어졌어요" : "맞콕하면 바로 매칭돼요",
      at: cook.sentAt,
      href: "/kok",
    });
  }

  for (const match of matches) {
    items.push({
      id: `match-${match.matchId}`,
      kind: "match",
      title: `${match.partner.nickname}님과 매칭됐어요`,
      body: "채팅으로 인사해보세요",
      at: match.matchedAt,
      href: `/match/${match.matchId}`,
    });

    // 내가 보낸 메시지는 알림이 아니다.
    const recent = match.recentMessage;
    if (recent && recent.senderId !== myUserId) {
      items.push({
        id: `message-${match.matchId}-${recent.sentAt}`,
        kind: "message",
        title: `${match.partner.nickname}님의 메시지`,
        body: recent.content,
        at: recent.sentAt,
        href: `/match/${match.matchId}`,
      });
    }
  }

  return items.sort((a, b) => parseServerTime(b.at) - parseServerTime(a.at));
}
