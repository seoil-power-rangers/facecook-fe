"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Heart, MessageCircle, Search } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TabBarMain } from "@ui/공통/TabBar";
import { getCooks } from "@ui/받은콕/cookApi";
import { getMatches } from "@ui/매칭/matchApi";
import { getProfiles } from "@ui/프로필작성/profileApi";
import {
  buildFeed,
  countUnseen,
  readLastSeen,
} from "@ui/알림/notificationFeed";
import { LIVE_BADGE_POLL_INTERVAL_MS } from "@ui/공통/constants";
import { CampusScene } from "./CampusScene";
import { Mascot } from "./Mascot";

/**
 * 홈. 참가자 목록 대신 마스코트와 오늘의 콕을 보여주고, 나머지 화면으로
 * 보내는 허브 역할만 한다. 목록은 /explore로 옮겼다.
 *
 * 하단 카드와 탭바가 같은 곳을 가리키지만 역할이 다르다 — 카드는 배지를 달고
 * 크게 보여주는 진입점이고, 탭바는 어느 화면에서든 한 번에 옮겨가는 길이다.
 */
export function MainScreen() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [todayUsed, setTodayUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [receivedKokCount, setReceivedKokCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    let active = true;

    /*
     * 셋을 따로 받는다. Promise.all로 묶으면 하나만 실패해도 나머지 둘까지
     * 버려져서, 콕은 멀쩡히 왔는데 화면에는 "없음"이 뜬다 — 데이터가 없는
     * 건지 조회가 실패한 건지 구분할 수 없게 된다.
     */
    getProfiles()
      .then((profiles) => {
        if (active) setTotalUsers(profiles.length);
      })
      .catch(() => undefined);

    getCooks()
      .then((cooks) => {
        if (!active) return;
        setTodayUsed(cooks.usage.todayUsed);
        setDailyLimit(cooks.usage.dailyLimit);
        // 만료된 것도 받은 건 받은 거라 같이 센다. 마이페이지 숫자와 같은 기준이다.
        setReceivedKokCount(cooks.received.length);
      })
      .catch(() => undefined);

    getMatches()
      .then((matches) => {
        if (active) setMatchCount(matches.length);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    // 종 배지도 화면에 머물러 있는 동안 주기적으로 갱신한다. 메시지는
    // facecook-be #44로 서버가 채팅방별 안읽음을 정확히 계산해주게 됐고
    // ChatScreen이 들어올 때/나갈 때 서버에도 읽음을 알리므로(markMatchRead),
    // 콕·매칭과 똑같이 실시간 집계에 포함해도 된다.
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      buildFeed()
        .then((feed) => {
          if (active) setUnseenCount(countUnseen(feed, readLastSeen()));
        })
        .catch(() => {
          // 배지는 부가 정보라 조회 실패 시 그냥 숨긴다.
        });
    };

    refresh();
    const interval = setInterval(refresh, LIVE_BADGE_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <PhoneFrame>
      <TabBarMain>
        <Hero totalUsers={totalUsers} unseenCount={unseenCount} />

        <div className="flex shrink-0 flex-col gap-4 bg-(--color-surface) px-4 pb-6 pt-5">
          <KokGauge used={todayUsed} limit={dailyLimit} />

          <Link
            href="/explore"
            className="flex items-center gap-3 rounded-[1.25rem] bg-(--color-home-explore) px-5 py-4 text-(--color-text-on-primary) transition-colors active:bg-(--color-home-explore-pressed)"
          >
            <Search className="h-7 w-7 shrink-0" aria-hidden="true" />
            <span className="flex flex-1 flex-col">
              <span className="text-lg font-bold">탐색하기</span>
              <span className="text-[13px] opacity-90">
                마음 가는 사람에게 콕을 보내보세요
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 opacity-80" aria-hidden="true" />
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <TileLink
              href="/kok"
              label="받은 콕"
              badge={receivedKokCount > 0 ? `${receivedKokCount}명` : null}
              className="bg-(--color-home-kok-bg)"
              labelClassName="text-(--color-home-kok-text)"
              badgeClassName="bg-(--color-home-kok-badge)"
              icon={<Heart className="h-6 w-6 text-(--color-home-kok-badge)" fill="currentColor" />}
            />
            <TileLink
              href="/match"
              label="채팅방"
              badge={matchCount > 0 ? `${matchCount}개` : null}
              className="bg-(--color-home-match-bg)"
              labelClassName="text-(--color-home-match-text)"
              badgeClassName="bg-(--color-home-match-badge)"
              icon={
                <MessageCircle
                  className="h-6 w-6 text-(--color-home-match-badge)"
                  fill="currentColor"
                  strokeWidth={0}
                />
              }
            />
          </div>
        </div>
      </TabBarMain>
    </PhoneFrame>
  );
}

/**
 * 캠퍼스 풍경 위에 마스코트가 서 있는 영역.
 *
 * 남는 높이를 시트가 아니라 이쪽이 가져간다. 시트가 늘어나면 버튼 아래가 흰
 * 여백으로 비는데, 히어로가 늘어나면 그만큼 하늘이 넓어지고 버튼은 엄지가
 * 닿는 아래쪽으로 내려온다.
 */
function Hero({
  totalUsers,
  unseenCount,
}: {
  totalUsers: number;
  unseenCount: number;
}) {
  return (
    <section className="relative flex flex-1 flex-col items-center bg-(--color-home-sky) px-5 pb-4 pt-6">
      <CampusScene />

      <Link
        href="/notifications"
        aria-label={
          unseenCount > 0 ? `알림 보관함, 새 알림 ${unseenCount}개` : "알림 보관함"
        }
        className="absolute right-4 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-(--color-surface)/85 text-(--color-text-body) shadow-(--shadow-card) backdrop-blur-sm"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unseenCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-bold text-(--color-text-on-primary)"
            aria-hidden="true"
          >
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        ) : null}
      </Link>

      <div className="relative z-10 w-full">
        <p className="text-xs font-medium text-(--color-text-sub)">총 사용자</p>
        <p className="flex items-baseline gap-1">
          <span className="text-[44px] font-extrabold leading-none tracking-tight text-(--color-text-strong) tabular-nums">
            {totalUsers}
          </span>
          <span className="text-lg font-semibold text-(--color-text-body)">명</span>
        </p>
      </div>

      <div className="flex-1" aria-hidden="true" />

      <p className="relative z-10 mt-3 text-lg font-bold text-(--color-text-sub)">
        콕찔러보기
      </p>

      <Mascot />
    </section>
  );
}

/**
 * 오늘의 콕 게이지.
 *
 * 쓴 횟수가 아니라 남은 횟수를 센다 — 막대가 가득 찬 상태가 콕을 다 갖고 있는
 * 상태다. 하루 한도는 API의 dailyLimit을 그대로 쓴다(기능명세는 3회, 시안은
 * 10회라 아직 확정 전이다).
 */
function KokGauge({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(limit - used, 0);
  const percent = limit > 0 ? (remaining / limit) * 100 : 0;

  return (
    <section className="pb-1">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-(--color-text-strong)">오늘의 콕</h2>
        <p className="text-(--color-home-explore)">
          <span className="text-2xl font-extrabold tabular-nums">{remaining}</span>
          <span className="ml-1 text-sm font-semibold">개 남음</span>
        </p>
      </div>

      <div
        className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-(--color-disabled-bg)"
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label="오늘 남은 콕"
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${percent}%`,
            backgroundImage:
              "linear-gradient(to right, var(--color-home-explore), var(--color-home-gauge-end))",
          }}
        />
      </div>

      <p className="mt-2 text-[13px] text-(--color-text-muted)">
        {limit > 0 ? `하루 최대 ${limit}회` : "하루 한도를 불러오는 중..."}
      </p>
    </section>
  );
}

interface TileLinkProps {
  href: string;
  label: string;
  badge: string | null;
  icon: React.ReactNode;
  className: string;
  labelClassName: string;
  badgeClassName: string;
}

function TileLink({
  href,
  label,
  badge,
  icon,
  className,
  labelClassName,
  badgeClassName,
}: TileLinkProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1.5 rounded-[1.25rem] px-4 py-5 ${className}`}
    >
      {icon}
      <span className={`text-base font-bold ${labelClassName}`}>{label}</span>
      {badge ? (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-(--color-text-on-primary) ${badgeClassName}`}
        >
          {badge}
        </span>
      ) : (
        <span className="text-xs text-(--color-text-muted)">없음</span>
      )}
    </Link>
  );
}
