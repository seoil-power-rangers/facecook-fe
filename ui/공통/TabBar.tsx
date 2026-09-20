"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, House, MessageCircle, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveBadges } from "@ui/공통/useLiveBadges";
import { useRejectedCooks } from "@ui/받은콕/rejectedCooks";

interface TabBarMainProps {
  children: ReactNode;
  className?: string;
}

/**
 * 탭바가 있는 화면의 <main> 영역.
 *
 * 탭바는 화면 맨 아래에 고정하고 본문만 스크롤한다. PhoneFrame이 h-dvh
 * 세로 flex라서, 스크롤되는 main을 flex-1로 늘리고 탭바를 그 형제로 두면
 * 콘텐츠 길이와 상관없이 바닥에 붙는다. 탭바를 main 안에 넣으면 본문과
 * 같이 밀려 내려가 스크롤해야 보인다.
 */
export function TabBarMain({ children, className = "" }: TabBarMainProps) {
  return (
    <>
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className={`flex flex-1 flex-col ${className}`.trim()}>{children}</div>
      </main>
      <TabBar />
    </>
  );
}

interface TabConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export function TabBar() {
  const pathname = usePathname();
  // 콕/매칭 조회는 useLiveBadges가 홈 화면과 공유해서 5초마다 한 번만
  // 나가게 한다 — 여기서 직접 폴링하면 같은 화면에서 두 번씩 나간다.
  // 킬스위치·에러 리포팅은 그 공유 폴링(liveBadgesStore) 안에서 처리한다.
  const { cooks, matches } = useLiveBadges();
  const rejected = useRejectedCooks();
  // 거절한 콕은 목록에서 사라지므로 배지에서도 빼야 숫자와 화면이 맞는다.
  const pendingReceivedCount =
    cooks?.received.filter(
      (cook) => cook.status === "pending" && !rejected.has(cook.cookId),
    ).length ?? 0;
  const unreadMessageCount =
    matches?.reduce((sum, match) => sum + (match.unreadCount ?? 0), 0) ?? 0;

  const tabs: TabConfig[] = [
    { href: "/main", label: "홈", icon: House },
    { href: "/explore", label: "탐색", icon: Compass },
    { href: "/kok", label: "콕", icon: Heart, badgeCount: pendingReceivedCount },
    { href: "/match", label: "채팅방", icon: MessageCircle, badgeCount: unreadMessageCount },
    { href: "/mypage", label: "마이", icon: User },
  ];

  return (
    <nav className="flex h-16 w-full shrink-0 items-stretch border-t border-(--color-border) bg-(--color-surface)">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const colorClassName = isActive ? "text-(--color-primary)" : "text-(--color-text-muted)";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${colorClassName}`} />
              {tab.badgeCount ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-semibold text-(--color-text-on-primary)">
                  {tab.badgeCount}
                </span>
              ) : null}
            </span>
            <span className={`whitespace-nowrap text-xs font-medium ${colorClassName}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
