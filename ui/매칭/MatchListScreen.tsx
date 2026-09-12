"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircleOff } from "lucide-react";
import { Avatar } from "@ui/공통/Avatar";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TabBarMain } from "@ui/공통/TabBar";
import { getMatches, matchErrorMessage, type MatchResponse } from "./matchApi";

const AVATAR_COLORS = ["#4F46E5", "#22C55E", "#5B5FE9", "#F59E0B", "#EF4444"];

export function MatchListScreen() {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMatches(await getMatches());
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

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center justify-center border-b border-(--color-border) bg-(--color-surface) px-4">
        <h1 className="text-lg font-bold text-(--color-text-strong)">매칭</h1>
      </header>

      <TabBarMain>
        {isLoading ? (
          <p className="px-6 py-20 text-center text-sm text-(--color-text-sub)">매칭 목록을 불러오는 중...</p>
        ) : null}
        {!isLoading && error ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-6 py-20 text-center text-sm text-(--color-danger)">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadMatches()}>
              다시 시도
            </Button>
          </div>
        ) : null}
        {!isLoading && !error && matches.length === 0 ? <EmptyMatches /> : null}
        {!isLoading && !error && matches.length > 0 ? (
          <div className="flex flex-col gap-2 p-4">
            {matches.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        ) : null}
      </TabBarMain>
    </PhoneFrame>
  );
}

function EmptyMatches() {
  return (
    <div className="flex flex-col items-center gap-3 p-6 pt-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-disabled-bg) text-(--color-text-muted)">
        <MessageCircleOff className="h-6 w-6" />
      </span>
      <p className="text-sm font-bold text-(--color-text-strong)">채팅이 아직 없어요</p>
      <p className="text-xs text-(--color-text-sub)">서로 콕하면 매칭되고, 그때부터 대화할 수 있어요.</p>
    </div>
  );
}

function MatchCard({ match }: { match: MatchResponse }) {
  const timestamp = match.recentMessage?.sentAt ?? match.matchedAt;

  return (
    <Link
      href={`/match/${match.matchId}`}
      className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3"
    >
      <Avatar
        name={match.partner.nickname}
        size="lg"
        bgColor={AVATAR_COLORS[match.partner.userId % AVATAR_COLORS.length]}
      />
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-(--color-text-strong)">
            {match.partner.nickname}
          </span>
          <span className="shrink-0 text-xs text-(--color-text-muted)">{formatRelativeTime(timestamp)}</span>
        </div>
        <span className="truncate text-xs text-(--color-text-sub)">
          {match.recentMessage?.content ?? "매칭됐어요. 먼저 인사해보세요!"}
        </span>
      </div>
    </Link>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}시간 전`;

  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(date);
}
