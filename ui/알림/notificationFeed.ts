"use client";

import { getCooks } from "@ui/받은콕/cookApi";
import { getMatches } from "@ui/매칭/matchApi";
import { getMyProfile } from "@ui/프로필작성/profileApi";
import { buildFeedFromData, type FeedItem } from "./feedBuilder";

export { buildFeedFromData } from "./feedBuilder";
export type { FeedItem, FeedKind } from "./feedBuilder";

const LAST_SEEN_KEY = "facecook:notifications:lastSeen";

/**
 * 알림 보관함 화면처럼 단독으로 진입하는 곳에서 콕·매칭·내 프로필을 조회해 알림을 만든다. 홈 화면은
 * 콕/매칭을 useLiveBadges로 이미 갖고 있어서 조회 없이 `buildFeedFromData`만 쓴다(같은 API가 두 번
 * 나가지 않게 하려는 것이다).
 */
export async function buildFeed(): Promise<FeedItem[]> {
  const [cooks, matches, me] = await Promise.all([
    getCooks(),
    getMatches(),
    getMyProfile(),
  ]);

  return buildFeedFromData(cooks, matches, me.userId);
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
