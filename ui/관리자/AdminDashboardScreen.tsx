"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { StatCard } from "@ui/공통/StatCard";
import { AdminShell } from "./AdminShell";
import { adminStats } from "./admin.mock";

/** 08 admin-dashboard — 부스 운영진이 열자마자 상황을 파악하는 화면. */
export function AdminDashboardScreen() {
  const {
    totalUsers,
    activeToday,
    totalCooks,
    totalMatches,
    missionCleared,
    pendingReports,
  } = adminStats;

  return (
    <AdminShell title="통계">
      <div className="flex flex-col gap-5 p-4">
        {pendingReports > 0 ? (
          <Link
            href="/admin/report"
            className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-danger-light) px-4 py-3"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-(--color-danger)" />
            <span className="flex-1 text-sm font-semibold text-(--color-danger)">
              미처리 신고 {pendingReports}건
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-(--color-danger)" />
          </Link>
        ) : null}

        <section>
          <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">
            참가자
          </h2>
          <div className="flex gap-2">
            <StatCard label="총 가입자" value={`${totalUsers}`} />
            <StatCard label="오늘 활성" value={`${activeToday}`} highlight />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">
            콕과 매칭
          </h2>
          <div className="flex gap-2">
            <StatCard label="보낸 콕" value={`${totalCooks}`} />
            <StatCard label="성사 매칭" value={`${totalMatches}`} highlight />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">
            부스 운영
          </h2>
          <div className="flex gap-2">
            <StatCard label="미션 완주" value={`${missionCleared}`} />
            <StatCard label="대기 신고" value={`${pendingReports}`} />
          </div>
        </section>

        <p className="px-1 text-xs leading-relaxed text-(--color-text-muted)">
          집계는 행사 기간 누적이며, 프로필·콕 기록은 매일 초기화됩니다.
        </p>
      </div>
    </AdminShell>
  );
}
