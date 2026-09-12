"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Inbox, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCooks } from "@ui/받은콕/cookApi";

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
    { href: "/main", label: "탐색", icon: Compass },
    { href: "/kok", label: "받은 콕", icon: Inbox, badgeCount: pendingReceivedCount },
    { href: "/match", label: "매칭", icon: Users },
    { href: "/mypage", label: "마이", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-16 w-full max-w-[430px] items-stretch border-t border-(--color-border) bg-(--color-surface)">
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
            <span className={`text-xs font-medium ${colorClassName}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
