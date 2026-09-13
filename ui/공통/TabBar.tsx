"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Inbox, MessageCircle, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCooks } from "@ui/받은콕/cookApi";

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
  const [pendingReceivedCount, setPendingReceivedCount] = useState(0);

  useEffect(() => {
    let active = true;
    getCooks()
      .then((data) => {
        if (!active) return;
        setPendingReceivedCount(
          data.received.filter((cook) => cook.status === "pending").length,
        );
      })
      .catch(() => {
        // 배지는 부가 정보라 조회 실패 시 그냥 숨긴다.
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  const tabs: TabConfig[] = [
    { href: "/main", label: "홈", icon: House },
    { href: "/explore", label: "탐색", icon: Compass },
    { href: "/kok", label: "콕", icon: Inbox, badgeCount: pendingReceivedCount },
    { href: "/match", label: "채팅방", icon: MessageCircle },
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
