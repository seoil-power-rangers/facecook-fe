"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, MessagesSquare } from "lucide-react";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { Tag } from "@ui/공통/Tag";
import { AdminShell } from "./AdminShell";
import {
  adminReports,
  type AdminReport,
  type AdminReportStatus,
} from "./admin.mock";

type ActionKind = "suspended" | "dismissed";

const TABS: { key: AdminReportStatus; label: string }[] = [
  { key: "pending", label: "대기" },
  { key: "reviewed", label: "처리완료" },
];

/** 10 admin-report — 신고를 보고 영구정지 또는 종결 처리한다. */
export function AdminReportScreen() {
  const [tab, setTab] = useState<AdminReportStatus>("pending");
  const [reports, setReports] = useState(adminReports);
  const [opened, setOpened] = useState<AdminReport | null>(null);
  const [confirming, setConfirming] = useState<ActionKind | null>(null);

  const visible = reports.filter((report) => report.status === tab);
  const pendingCount = reports.filter(
    (report) => report.status === "pending",
  ).length;

  const applyAction = () => {
    if (!opened || !confirming) {
      return;
    }
    // 서버가 붙으면 report.status와 user.status를 여기서 갱신한다.
    setReports((prev) =>
      prev.map((report) =>
        report.reportId === opened.reportId
          ? { ...report, status: "reviewed", action: confirming }
          : report,
      ),
    );
    setConfirming(null);
    setOpened(null);
  };

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
                {item.label}
                {badge > 0 ? ` ${badge}` : ""}
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            {tab === "pending"
              ? "미처리 신고가 없어요."
              : "처리한 신고가 없어요."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((report) => (
              <li key={report.reportId}>
                <button
                  type="button"
                  onClick={() => setOpened(report)}
                  className="flex w-full items-center gap-3 rounded-(--radius-lg) bg-(--color-surface) p-3.5 text-left shadow-(--shadow-card)"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-(--color-text-strong)">
                        {report.reporterName} → {report.reportedName}
                      </p>
                      {report.action ? (
                        <Tag
                          variant={
                            report.action === "suspended" ? "warning" : "default"
                          }
                        >
                          {report.action === "suspended" ? "영구정지" : "종결"}
                        </Tag>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-(--color-text-sub)">
                      {report.reason}
                    </p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">
                      {report.createdAt} 접수
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
          setOpened(null);
          setConfirming(null);
        }}
      >
        {opened ? (
          <div className="max-h-[70vh] overflow-y-auto px-5 pt-3">
            {confirming ? (
              <ActionConfirm
                kind={confirming}
                targetName={opened.reportedName}
                onCancel={() => setConfirming(null)}
                onConfirm={applyAction}
              />
            ) : (
              <ReportDetail
                report={opened}
                onAction={(kind) => setConfirming(kind)}
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
  onAction,
}: {
  report: AdminReport;
  onAction: (kind: ActionKind) => void;
}) {
  const done = report.status === "reviewed";

  return (
    <>
      <h2 className="text-[17px] font-bold text-(--color-text-strong)">
        {report.reportedName} 님에 대한 신고
      </h2>
      <p className="mt-1 text-xs text-(--color-text-muted)">
        신고자 {report.reporterName} · {report.createdAt} 접수
      </p>

      <div className="mt-4 rounded-(--radius-lg) bg-(--color-surface-alt) p-3.5">
        <p className="text-sm font-bold text-(--color-text-strong)">
          {report.reason}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-body)">
          {report.detail}
        </p>
      </div>

      {report.chatroomId ? (
        <Link
          href={`/admin/chat/${report.reportId}`}
          className="mt-3 flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border) px-3.5 py-3"
        >
          <MessagesSquare className="h-5 w-5 shrink-0 text-(--color-primary)" />
          <span className="flex-1 text-sm font-semibold text-(--color-text-strong)">
            이 신고 건의 채팅 보기
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
        </Link>
      ) : (
        <p className="mt-3 text-xs text-(--color-text-muted)">
          이 신고에 엮인 채팅방이 없어요.
        </p>
      )}

      {done ? (
        <div className="mt-5">
          <InfoBox>
            이미 처리한 신고입니다 —{" "}
            {report.action === "suspended" ? "영구정지" : "정지 없이 종결"}.
          </InfoBox>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => onAction("dismissed")}
          >
            정지 없이 종결
          </Button>
          <Button fullWidth onClick={() => onAction("suspended")}>
            영구정지
          </Button>
        </div>
      )}
    </>
  );
}

function ActionConfirm({
  kind,
  targetName,
  onCancel,
  onConfirm,
}: {
  kind: ActionKind;
  targetName: string;
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
      {suspend ? (
        <p className="mt-2 text-xs text-(--color-danger)">
          되돌리는 화면이 아직 없어요. 신중하게 눌러주세요.
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button fullWidth onClick={onConfirm}>
          {suspend ? "영구정지" : "종결"}
        </Button>
      </div>
    </>
  );
}
