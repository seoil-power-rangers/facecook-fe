"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { TabBarMain } from "@ui/공통/TabBar";
import { getMyProfile } from "@ui/프로필작성/profileApi";
import { getMatches, matchErrorMessage, type MatchResponse } from "./matchApi";
import { byRecentActivity, unreadCountOf } from "./readState";

export function MatchListScreen() {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 마지막 메시지를 내가 보냈는지 알아야 안 읽음을 셀 수 있다.
      const [list, me] = await Promise.all([getMatches(), getMyProfile()]);
      setMatches([...list].sort(byRecentActivity));
      setMyUserId(me.userId);
    } catch (loadError) {
      setError(matchErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 최초 진입 시 서버 목록을 React 상태에 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMatches();
  }, [loadMatches]);

  const unreadRooms = matches.filter(
    (match) => unreadCountOf(match, myUserId) > 0,
  ).length;

  return (
    <PhoneFrame>
      {/* 받은 콕 화면과 같은 모양의 머리표 — 옅은 바탕에 아이콘, 그 옆에 제목. */}
      <header className="flex h-14 w-full shrink-0 items-center gap-2 bg-(--color-surface) px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-accent-soft) text-(--color-accent)">
          <MessageCircle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
        </span>
        <h1 className="text-lg font-bold text-(--color-text-strong)">채팅방</h1>
      </header>

      <TabBarMain className="gap-4 px-4 pb-4">
        {isLoading ? (
          <p className="px-6 py-20 text-center text-sm text-(--color-text-sub)">
            채팅방을 불러오는 중...
          </p>
        ) : null}

        {!isLoading && error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 py-20 text-center text-sm text-(--color-danger)"
          >
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadMatches()}>
              다시 시도
            </Button>
          </div>
        ) : null}

        {!isLoading && !error && matches.length === 0 ? <EmptyMatches /> : null}

        {!isLoading && !error && matches.length > 0 ? (
          <>
            <Summary total={matches.length} unreadRooms={unreadRooms} />

            <ul className="flex flex-col overflow-hidden rounded-[1.25rem] border border-(--color-border) bg-(--color-surface)">
              {matches.map((match, index) => (
                <li key={match.matchId}>
                  <MatchRow
                    match={match}
                    unread={unreadCountOf(match, myUserId)}
                    divided={index > 0}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </TabBarMain>
    </PhoneFrame>
  );
}

/**
 * 매칭 수를 한 번만 축하하고 끝낸다. 목록의 카드마다 반복하면 글자가 아니라
 * 무늬가 된다.
 */
function Summary({ total, unreadRooms }: { total: number; unreadRooms: number }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-[1.25rem] bg-(--color-accent-soft) p-4">
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-[15px] font-bold text-(--color-text-strong)">
          총 {total}커플 매칭됐어요 🎉
        </p>
        <p className="text-[13px] text-(--color-text-sub)">
          {unreadRooms > 0
            ? `안 읽은 대화가 ${unreadRooms}개 있어요`
            : "채팅으로 대화를 시작해 보세요"}
        </p>
      </div>
      {/* 정적 파일이라 next/image의 최적화가 필요 없다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/chat.png" alt="" className="h-16 w-auto shrink-0" />
    </div>
  );
}

/**
 * 카카오톡 대화 목록과 같은 구조 — 줄 전체가 방으로 들어가는 버튼이고,
 * 오른쪽에 시각과 안 읽음 수가 세로로 쌓인다. 따로 [채팅] 버튼을 두지 않는다.
 */
function MatchRow({
  match,
  unread,
  divided,
}: {
  match: MatchResponse;
  unread: number;
  divided: boolean;
}) {
  const recent = match.recentMessage;

  return (
    <Link
      href={`/match/${match.matchId}`}
      className={`flex items-center gap-3 px-4 py-3.5 active:bg-(--color-surface-alt) ${
        divided ? "border-t border-(--color-border)" : ""
      }`}
    >
      <Avatar name={match.partner.nickname} size="lg" userId={match.partner.userId} />

      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-bold text-(--color-text-strong)">
            {match.partner.nickname}
          </span>
          <Tag variant="accent">{match.partner.mbti}</Tag>
        </div>
        {/*
          대화가 시작되기 전에는 학과를 보여준다 — 누구였는지 기억해야 첫
          말을 걸 수 있다. 한 번이라도 오가면 카카오톡처럼 마지막 메시지로 바뀐다.
        */}
        <span
          className={`truncate text-[13px] ${
            unread > 0
              ? "font-medium text-(--color-text-body)"
              : "text-(--color-text-sub)"
          }`}
        >
          {recent?.content ?? match.partner.department ?? "먼저 인사를 건네보세요"}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[11px] text-(--color-text-muted)">
          {formatWhen(recent?.sentAt ?? match.matchedAt)}
        </span>
        {unread > 0 ? (
          <span
            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-danger) px-1 text-[11px] font-bold text-(--color-text-on-primary) tabular-nums"
            aria-label={`안 읽은 메시지 ${unread}개`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function EmptyMatches() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
      <span className="text-4xl" aria-hidden="true">
        💬
      </span>
      <p className="text-sm font-bold text-(--color-text-strong)">아직 채팅방이 없어요</p>
      <p className="text-xs text-(--color-text-sub)">
        서로 콕하면 매칭되고, 그때부터 대화할 수 있어요
      </p>
      <Link
        href="/explore"
        className="mt-2 rounded-full bg-(--color-primary) px-5 py-2.5 text-sm font-bold text-(--color-text-on-primary)"
      >
        참가자 둘러보기
      </Link>
    </div>
  );
}

/** 카카오톡과 같은 표기 — 오늘은 시각, 어제는 "어제", 그 전은 날짜. */
function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "어제";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}
