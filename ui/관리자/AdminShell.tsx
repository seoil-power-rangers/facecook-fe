"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { useSession } from "@ui/공통/session";
import { AdminTabBar } from "./AdminTabBar";
import { adminStats } from "./admin.mock";

/** 관리자 화면 공통 껍데기 — 상단 바 + 하단 탭. */
export function AdminShell({
  title,
  children,
  showTabBar = true,
}: {
  title: string;
  children: ReactNode;
  showTabBar?: boolean;
}) {
  const router = useRouter();
  const { session, signOut } = useSession();

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-4">
        <h1 className="flex-1 truncate text-base font-bold text-(--color-text-strong)">
          {title}
        </h1>
        <span className="truncate text-xs text-(--color-text-sub)">
          {session.name}
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="로그아웃"
          className="p-1 text-(--color-text-muted)"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-(--color-bg)">{children}</main>

      {showTabBar ? (
        <AdminTabBar pendingReports={adminStats.pendingReports} />
      ) : null}
    </PhoneFrame>
  );
}
