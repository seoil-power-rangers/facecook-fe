"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Infinity as InfinityIcon, Send, Ticket } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { Tag } from "@ui/공통/Tag";
import { avatarColor, avatarEmoji } from "@ui/공통/avatarColor";
import { getMatch, matchErrorMessage, type MatchResponse } from "./matchApi";

export function MatchedCelebrationScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const numericMatchId = Number(matchId);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    if (!Number.isInteger(numericMatchId) || numericMatchId <= 0) {
      setError("올바르지 않은 매칭 주소예요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setMatch(await getMatch(numericMatchId));
    } catch (loadError) {
      setError(matchErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericMatchId]);

  useEffect(() => {
    // 라우트의 matchId가 바뀌면 해당 매칭 상세를 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMatch();
  }, [loadMatch]);

  if (isLoading || error || !match) {
    return (
      <PhoneFrame>
        <header className="flex h-14 shrink-0 items-center border-b border-(--color-border) bg-(--color-surface) px-3">
          <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
        <div
          role={error ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            error ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{error ?? "매칭 정보를 불러오는 중..."}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadMatch()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  const interests = match.partner.hobby
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 flex-col items-center gap-4 bg-(--color-hero-bg) px-6 pb-12 pt-3 text-center text-(--color-hero-text)">
          <div className="flex w-full items-center">
            <button type="button" aria-label="뒤로가기" className="p-1" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs font-semibold tracking-[0.2em] text-(--color-hero-text-sub)">MATCHED</p>

          <div className="relative flex items-center justify-center py-2">
            <div className="z-0 -mr-6 flex h-24 w-24 items-center justify-center rounded-full bg-(--color-primary-light) text-2xl font-bold text-(--color-primary) ring-4 ring-(--color-hero-bg)">
              나
            </div>
            <div
              className="z-0 -ml-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl ring-4 ring-(--color-hero-bg)"
              style={{ backgroundColor: avatarColor(match.partner.userId) }}
              aria-label={match.partner.nickname}
              role="img"
            >
              {avatarEmoji(match.partner.userId)}
            </div>
            <div className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface) text-(--color-primary) shadow-(--shadow-card)">
              <InfinityIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold">매칭됐어요</p>
            <p className="text-sm text-(--color-hero-text-sub)">{match.partner.nickname}님과 서로 콕했어요</p>
          </div>
        </div>

        <div className="-mt-4 flex flex-1 flex-col gap-5 rounded-t-[1.75rem] bg-(--color-surface) p-5">
          <div className="flex flex-col gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-(--shadow-card)">
            <div className="flex items-center justify-between">
              <Tag variant="primary">STEP 1</Tag>
              <Ticket className="h-4 w-4 text-(--color-text-sub)" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-(--color-text-strong)">둘이 함께 인증사진 찍기</p>
            <p className="text-xs text-(--color-text-sub)">
              총학생회 부스에서 인증받으면 선물을 받고 다음 미션이 열려요.
            </p>
          </div>

          {interests.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-(--color-text-strong)">
                {match.partner.nickname}님이 좋아해요
              </p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-sub)"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-2">
            <Link href={`/match/${match.matchId}`} className="w-full">
              <Button fullWidth className="gap-2">
                <Send className="h-4 w-4" />
                채팅 시작하기
              </Button>
            </Link>
            <p className="text-xs text-(--color-text-muted)">채팅방은 서비스 종료까지 유지돼요</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
