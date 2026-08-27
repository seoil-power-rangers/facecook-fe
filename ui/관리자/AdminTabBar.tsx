"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flag, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AdminTabConfig {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * 관리자 전용 탭. 참가자용 TabBar와 섞이면 안 되니 따로 둔다.
 * 채팅 열람은 신고에서만 들어가므로 탭에 없다.
 */
const tabs: AdminTabConfig[] = [
  { href: "/admin/dashboard", label: "통계", icon: BarChart3 },
  { href: "/admin/mission", label: "미션", icon: ListChecks },
  { href: "/admin/report", label: "신고", icon: Flag },
];

export function AdminTabBar({ pendingReports = 0 }: { pendingReports?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-16 w-full shrink-0 items-stretch border-t border-(--color-border) bg-(--color-surface)">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const colorClassName = isActive
          ? "text-(--color-primary)"
          : "text-(--color-text-muted)";
        const badge = tab.href === "/admin/report" ? pendingReports : 0;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${colorClassName}`} />
              {badge > 0 ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-(--radius-full) bg-(--color-danger) px-1 text-[10px] font-semibold text-(--color-text-on-primary)">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className={`text-xs font-medium ${colorClassName}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
