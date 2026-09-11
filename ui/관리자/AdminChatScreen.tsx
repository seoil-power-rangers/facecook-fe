"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import {
  adminErrorMessage,
  getAdminReport,
  getAdminReportChat,
  getAdminUserNames,
  type AdminReportChatMessageResponse,
  type AdminReportResponse,
} from "./adminApi";

/** 11 admin-chat — 신고와 엮인 채팅방만 읽기 전용으로 연다. */
export function AdminChatScreen({ reportId }: { reportId: string }) {
  const router = useRouter();
  const numericReportId = Number(reportId);
  const [report, setReport] = useState<AdminReportResponse | null>(null);
  const [messages, setMessages] = useState<AdminReportChatMessageResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChat = useCallback(async () => {
    if (!Number.isInteger(numericReportId) || numericReportId <= 0) {
      setError("올바르지 않은 신고 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [reportResponse, chatResponse] = await Promise.all([
        getAdminReport(numericReportId),
        getAdminReportChat(numericReportId),
      ]);
      setReport(reportResponse);
      setMessages(chatResponse);
      setUserNames(
        await getAdminUserNames([
          reportResponse.reporterId,
          reportResponse.reportedUserId,
        ]),
      );
    } catch (loadError) {
      setError(adminErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericReportId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadChat();
  }, [loadChat]);

  const reporterName = report
    ? displayName(userNames, report.reporterId)
    : "신고자";
  const reportedName = report
    ? displayName(userNames, report.reportedUserId)
    : "신고 대상";

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button type="button" aria-label="뒤로" className="p-1" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-(--color-text-strong)">
            {reporterName} · {reportedName}
          </p>
          <p className="truncate text-xs text-(--color-text-sub)">신고 #{reportId} · 읽기 전용</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto bg-(--color-chat-bg) p-4">
        <InfoBox tone="info">
          신고 처리를 위해 열람 중입니다. 이 대화는 신고 검토 외의 목적으로 쓰면 안 돼요.
        </InfoBox>

        {isLoading || error || !report ? (
          <div
            role={error ? "alert" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm ${
              error ? "text-(--color-danger)" : "text-(--color-text-sub)"
            }`}
          >
            <span>{error ?? "신고 관련 채팅을 불러오는 중..."}</span>
            {error ? (
              <Button size="sm" variant="outline" onClick={() => void loadChat()}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">주고받은 메시지가 없어요.</p>
        ) : (
          messages.map((message) => {
            const fromReported = message.senderId === report.reportedUserId;
            const senderName = fromReported
              ? reportedName
              : message.senderId === report.reporterId
                ? reporterName
                : `참가자 #${message.senderId}`;

            return (
              <div key={message.messageId} className="flex flex-col gap-1">
                <span className="text-xs text-(--color-text-sub)">
                  {senderName} · {formatTime(message.sentAt)}
                </span>
                <p
                  className={`max-w-[80%] rounded-(--radius-lg) px-3.5 py-2.5 text-sm leading-relaxed ${
                    fromReported
                      ? "bg-(--color-danger-light) text-(--color-text-strong)"
                      : "bg-(--color-chat-other) text-(--color-chat-other-text)"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            );
          })
        )}
      </main>
    </PhoneFrame>
  );
}

function displayName(names: Record<number, string>, userId: number) {
  return names[userId] ?? `참가자 #${userId}`;
}

function formatTime(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? value;
}
