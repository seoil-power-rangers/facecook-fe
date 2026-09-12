"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { StatCard } from "@ui/공통/StatCard";
import {
  adminErrorMessage,
  getAdminStats,
  type AdminStatsResponse,
} from "./adminApi";
import { AdminShell } from "./AdminShell";

/** 08 admin-dashboard — 부스 운영진이 열자마자 상황을 파악하는 화면. */
export function AdminDashboardScreen() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getAdminStats());
    } catch (loadError) {
      setError(adminErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStats();
  }, [loadStats]);

  return (
    <AdminShell title="통계">
      {isLoading || error || !stats ? (
        <div
          role={error ? "alert" : undefined}
          className={`flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            error ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{error ?? "운영 통계를 불러오는 중..."}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadStats()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      ) : (
        <DashboardContent stats={stats} />
      )}
    </AdminShell>
  );
}

function DashboardContent({ stats }: { stats: AdminStatsResponse }) {
  const {
    totalUsers,
    activeToday,
    totalCooks,
    totalMatches,
    missionCleared,
    pendingReports,
  } = stats;

  return (
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
        <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">참가자</h2>
        <div className="flex gap-2">
          <StatCard label="총 가입자" value={`${totalUsers}`} />
          <StatCard label="오늘 활성" value={`${activeToday}`} highlight />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">콕과 매칭</h2>
        <div className="flex gap-2">
          <StatCard label="보낸 콕" value={`${totalCooks}`} />
          <StatCard label="성사 매칭" value={`${totalMatches}`} highlight />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold text-(--color-text-sub)">부스 운영</h2>
        <div className="flex gap-2">
          <StatCard label="미션 완주" value={`${missionCleared}`} />
          <StatCard label="대기 신고" value={`${pendingReports}`} />
        </div>
      </section>

      <p className="px-1 text-xs leading-relaxed text-(--color-text-muted)">
        집계는 행사 기간 누적이며, 활성 참가자는 서버의 운영 기준에 따라 계산됩니다.
      </p>
    </div>
  );
}
