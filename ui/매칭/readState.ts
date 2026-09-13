"use client";

import type { MatchResponse } from "./matchApi";

/**
 * 채팅방을 마지막으로 연 시각.
 *
 * 서버에 읽음 상태가 없어서(GET /api/matches 응답에 unreadCount가 없다) 방마다
 * 마지막으로 연 시각을 브라우저에 남기고, 그보다 나중에 온 상대 메시지를
 * 안 읽은 것으로 본다.
 *
 * 이 방식의 한계는 분명하다 — 기기마다 따로 센다. 부스에서 각자 자기 폰만
 * 쓰는 3일짜리 행사라 그대로 간다. 서버가 unreadCount를 주면
 * MatchResponse의 그 값이 우선한다(unreadCountOf 참고).
 */
const STORAGE_KEY = "facecook:chat:lastRead";

type LastReadMap = Record<string, number>;

function read(): LastReadMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as LastReadMap;
  } catch {
    // 시크릿 모드 등에서 막히면 전부 안 읽은 것으로 본다.
    return {};
  }
}

export function markRoomRead(matchId: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...read(), [matchId]: Date.now() }),
    );
  } catch {
    // 저장 실패는 무시 — 배지가 안 사라질 뿐이다.
  }
}

/**
 * 안 읽은 메시지 수. 서버가 세어주면 그 값을, 아니면 "있다/없다"만 알 수
 * 있으므로 1을 돌려준다.
 */
export function unreadCountOf(match: MatchResponse, myUserId: number | null) {
  if (typeof match.unreadCount === "number") {
    return match.unreadCount;
  }

  const recent = match.recentMessage;
  // 내가 보낸 메시지는 안 읽은 게 아니다.
  if (!recent || myUserId === null || recent.senderId === myUserId) {
    return 0;
  }

  const sentAt = Date.parse(recent.sentAt);
  if (Number.isNaN(sentAt)) {
    return 0;
  }

  return sentAt > (read()[match.matchId] ?? 0) ? 1 : 0;
}

/** 최근 대화가 있었던 방이 위로. 카카오톡과 같은 순서다. */
export function byRecentActivity(a: MatchResponse, b: MatchResponse) {
  const at = Date.parse(a.recentMessage?.sentAt ?? a.matchedAt);
  const bt = Date.parse(b.recentMessage?.sentAt ?? b.matchedAt);
  return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
}
