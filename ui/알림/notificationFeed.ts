"use client";

import { getCooks, type CookListResponse } from "@ui/받은콕/cookApi";
import { getMatches, type MatchResponse } from "@ui/매칭/matchApi";
import { getMyProfile } from "@ui/프로필작성/profileApi";

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

const LAST_SEEN_KEY = "facecook:notifications:lastSeen";

export async function buildFeed(): Promise<FeedItem[]> {
  const [cooks, matches, me] = await Promise.all([
    getCooks(),
    getMatches(),
    getMyProfile(),
  ]);

  return buildFeedFromData(cooks, matches, me.userId);
}

/**
 * 홈 화면은 콕/매칭을 useLiveBadges로 이미 공유해서 갖고 있다 — 여기서
 * 또 조회하면 같은 API가 두 번 나간다. 그래서 조회 없이 조합만 하는
 * 버전을 따로 둔다. `buildFeed()`는 이 함수를 조회 후 호출하는 얇은
 * 래퍼일 뿐이다(알림 보관함 화면처럼 단독으로 진입하는 곳에서 씀).
 */
export function buildFeedFromData(
  cooks: CookListResponse,
  matches: MatchResponse[],
  myUserId: number,
): FeedItem[] {
  const items: FeedItem[] = [];

  // 거절한 콕은 서버가 받은 목록에서 빼므로 알림에도 남지 않는다.
  for (const cook of cooks.received) {
    items.push({
      id: `cook-${cook.cookId}`,
      kind: "cook",
      title: `${cook.profile.nickname}님이 콕을 보냈어요`,
      body:
        cook.status === "matched"
          ? "매칭으로 이어졌어요"
          : "맞콕하면 바로 매칭돼요",
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

  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** 보관함을 마지막으로 연 시각. 안 읽은 개수를 세는 기준이 된다. */
export function readLastSeen(): number {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0;
  } catch {
    // 시크릿 모드 등에서 막히면 전부 새 알림으로 본다.
    return 0;
  }
}

export function markAllSeen() {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {
    // 저장 실패는 무시 — 배지가 안 사라질 뿐이다.
  }
}

export function countUnseen(items: FeedItem[], lastSeen: number) {
  return items.filter((item) => Date.parse(item.at) > lastSeen).length;
}

/** "방금 · 12분 전 · 3시간 전 · 어제 · 9월 30일" */
export function formatRelative(at: string, now = Date.now()) {
  const diff = now - Date.parse(at);
  if (Number.isNaN(diff)) return "";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return "어제";

  const date = new Date(at);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
