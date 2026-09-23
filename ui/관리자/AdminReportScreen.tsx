"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MessagesSquare } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { createRequestSequence } from "@ui/공통/requestSequence";
import { Tag } from "@ui/공통/Tag";
import {
  adminErrorMessage,
  getAdminReport,
  getAdminReports,
  getAdminUserNames,
  resolveAdminReport,
  type AdminReportResponse,
  type AdminReportStatus,
} from "./adminApi";
import { AdminLoadState } from "./AdminLoadState";
import { AdminShell } from "./AdminShell";
import { formatServerTimeShort } from "@ui/공통/serverTime";

type ActionKind = "suspended" | "dismissed";

const TABS: { key: AdminReportStatus; label: string }[] = [
  { key: "pending", label: "대기" },
  { key: "reviewed", label: "처리완료" },
];

/** 10 admin-report — 신고를 보고 영구정지 또는 종결 처리한다. */
export function AdminReportScreen() {
  const [tab, setTab] = useState<AdminReportStatus>("pending");
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [opened, setOpened] = useState<AdminReportResponse | null>(null);
  const [confirming, setConfirming] = useState<ActionKind | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // 신고 A를 열었다가 B로 넘어간 뒤 A의 응답이 늦게 도착해도 B 화면을 건드리지 않게
  // 한다 — 가장 최근에 시작한 조회만 성공·실패·로딩 종료를 반영한다.
  const [detailRequests] = useState(createRequestSequence);
  // 이름 조회도 별도 순번을 둔다 — "다시 시도"로 loadReports가 다시 불리면 이름
  // 조회도 다시 진행 중일 수 있다. 순번이 없으면, 먼저 시작했지만 늦게 끝난 조회의
  // (예: 일시적 실패로 인한 "참가자 #ID" 폴백) 결과가 나중에 시작해 먼저 끝난
  // 조회의 정상 이름을 덮어쓴다.
  const [nameRequests] = useState(createRequestSequence);

  /**
   * 이름 조회는 기다리지 않는다 — 신고가 늘수록 고유 사용자도 늘어 가장 느린 이름
   * 조회 하나가 목록 표시 자체를 막았다. 목록을 먼저 보여주고, 이름은 도착하는
   * 대로 채운다(먼저 알고 있던 이름을 지우지 않도록 병합하되, 가장 최근에 시작한
   * 이름 조회만 반영한다).
   */
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getAdminReports();
      setReports(response);
      const nameRequestId = nameRequests.begin();
      void getAdminUserNames(
        response.flatMap((report) => [report.reporterId, report.reportedUserId]),
      )
        .then((names) => {
          if (!nameRequests.isLatest(nameRequestId)) return;
          setUserNames((current) => ({ ...current, ...names }));
        })
        .catch(() => {});
    } catch (error) {
      setLoadError(adminErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [nameRequests]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
    // 화면을 떠난 뒤에 도착한 이름 조회가 상태를 바꾸지 않게 한다.
    return () => nameRequests.invalidate();
  }, [loadReports, nameRequests]);

  const openReport = async (report: AdminReportResponse) => {
    const requestId = detailRequests.begin();
    setOpened(report);
    setConfirming(null);
    setActionError(null);
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAdminReport(report.reportId);
      if (!detailRequests.isLatest(requestId)) return;
      setOpened(detail);
    } catch (error) {
      if (!detailRequests.isLatest(requestId)) return;
      setDetailError(adminErrorMessage(error));
    } finally {
      if (detailRequests.isLatest(requestId)) setIsDetailLoading(false);
    }
  };

  const applyAction = async () => {
    if (!opened || !confirming || isResolving) return;

    setIsResolving(true);
    setActionError(null);
    try {
      const updated = await resolveAdminReport(
        opened.reportId,
        confirming === "suspended",
      );
      setReports((current) =>
        current.map((report) =>
          report.reportId === updated.reportId ? updated : report,
        ),
      );
      setOpened(updated);
      setConfirming(null);
    } catch (error) {
      setActionError(adminErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const visible = reports.filter((report) => report.status === tab);
  const pendingCount = reports.filter((report) => report.status === "pending").length;

  return (
    <AdminShell title="신고 처리">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          {TABS.map((item) => {
            const on = tab === item.key;
            const badge = item.key === "pending" ? pendingCount : 0;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={on}
                onClick={() => setTab(item.key)}
                className={`h-9 flex-1 rounded-(--radius-sm) text-sm font-bold transition-colors ${
                  on
                    ? "bg-(--color-primary) text-(--color-text-on-primary)"
                    : "bg-(--color-surface) text-(--color-text-sub)"
                }`}
              >
                {item.label}{badge > 0 ? ` ${badge}` : ""}
              </button>
            );
          })}
        </div>

        {isLoading || loadError ? (
          <AdminLoadState
            loading={isLoading}
            error={loadError}
            onRetry={() => void loadReports()}
          />
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            {tab === "pending" ? "미처리 신고가 없어요." : "처리한 신고가 없어요."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((report) => (
              <li key={report.reportId}>
                <button
                  type="button"
                  onClick={() => void openReport(report)}
                  className="flex w-full items-center gap-3 rounded-(--radius-lg) bg-(--color-surface) p-3.5 text-left shadow-(--shadow-card)"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-(--color-text-strong)">
                        {displayName(userNames, report.reporterId)} → {displayName(userNames, report.reportedUserId)}
                      </p>
                      {report.status === "reviewed" ? <Tag variant="default">처리완료</Tag> : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-(--color-text-sub)">{report.reason}</p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">
                      {formatServerTimeShort(report.createdAt)} 접수
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomSheet
        open={opened !== null}
        onClose={() => {
          if (isResolving) return;
          detailRequests.invalidate();
          setOpened(null);
          setConfirming(null);
          setDetailError(null);
        }}
      >
        {opened ? (
          <div className="max-h-[70vh] overflow-y-auto px-5 pt-3">
            {isDetailLoading ? (
              <p className="py-8 text-center text-sm text-(--color-text-sub)">신고 상세를 불러오는 중...</p>
            ) : detailError ? (
              <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center text-sm text-(--color-danger)">
                <span>{detailError}</span>
                <Button size="sm" variant="outline" onClick={() => void openReport(opened)}>
                  다시 시도
                </Button>
              </div>
            ) : confirming ? (
              <ActionConfirm
                kind={confirming}
                targetName={displayName(userNames, opened.reportedUserId)}
                loading={isResolving}
                error={actionError}
                onCancel={() => setConfirming(null)}
                onConfirm={() => void applyAction()}
              />
            ) : (
              <ReportDetail
                report={opened}
                reporterName={displayName(userNames, opened.reporterId)}
                reportedName={displayName(userNames, opened.reportedUserId)}
                onAction={(kind) => {
                  setActionError(null);
                  setConfirming(kind);
                }}
              />
            )}
          </div>
        ) : null}
      </BottomSheet>
    </AdminShell>
  );
}

function ReportDetail({
  report,
  reporterName,
  reportedName,
  onAction,
}: {
  report: AdminReportResponse;
  reporterName: string;
  reportedName: string;
  onAction: (kind: ActionKind) => void;
}) {
  const done = report.status === "reviewed";

  return (
    <>
      <h2 className="text-[17px] font-bold text-(--color-text-strong)">{reportedName} 님에 대한 신고</h2>
      <p className="mt-1 text-xs text-(--color-text-muted)">
        신고자 {reporterName} · {formatServerTimeShort(report.createdAt)} 접수
      </p>

      <div className="mt-4 rounded-(--radius-lg) bg-(--color-surface-alt) p-3.5">
        <p className="text-sm font-bold text-(--color-text-strong)">{report.reason}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-body)">
          {report.detail || "작성된 상세 내용이 없습니다."}
        </p>
      </div>

      <Link
        href={`/admin/chat/${report.reportId}`}
        className="mt-3 flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) px-3.5 py-3"
      >
        <MessagesSquare className="h-5 w-5 shrink-0 text-(--color-primary)" />
        <span className="flex-1 text-sm font-semibold text-(--color-text-strong)">이 신고 건의 채팅 보기</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
      </Link>

      {done ? (
        <div className="mt-5">
          <InfoBox>
            {report.reviewedAt
              ? `${formatServerTimeShort(report.reviewedAt)}에 처리한 신고입니다.`
              : "이미 처리한 신고입니다."}
          </InfoBox>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="secondary" fullWidth onClick={() => onAction("dismissed")}>
            정지 없이 종결
          </Button>
          <Button fullWidth onClick={() => onAction("suspended")}>영구정지</Button>
        </div>
      )}
    </>
  );
}

function ActionConfirm({
  kind,
  targetName,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  kind: ActionKind;
  targetName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const suspend = kind === "suspended";
  return (
    <>
      <h2 className="text-[17px] font-bold text-(--color-text-strong)">
        {suspend ? `${targetName} 님을 영구정지할까요?` : "정지 없이 종결할까요?"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-body)">
        {suspend
          ? "이 참가자는 즉시 서비스를 쓸 수 없게 되고, 행사 기간 내내 다시 들어올 수 없어요."
          : "신고를 처리 완료로 표시만 하고 참가자에게는 아무 조치도 하지 않아요."}
      </p>
      {suspend ? <p className="mt-2 text-xs text-(--color-danger)">되돌리는 화면이 아직 없어요. 신중하게 눌러주세요.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-(--color-danger)">{error}</p> : null}

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth disabled={loading} onClick={onCancel}>취소</Button>
        <Button fullWidth disabled={loading} onClick={onConfirm}>
          {loading ? "처리 중..." : suspend ? "영구정지" : "종결"}
        </Button>
      </div>
    </>
  );
}

function displayName(names: Record<number, string>, userId: number) {
  return names[userId] ?? `참가자 #${userId}`;
}
