"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import type { AdminReport } from "./admin.mock";

/**
 * 11 admin-chat — 신고와 엮인 채팅방만 읽기 전용으로 연다.
 *
 * 참가자끼리 나눈 사적인 대화라 신고 없이는 들어올 수 없다. 진입점은
 * 신고 상세 화면 하나뿐이고, 입력창은 두지 않는다.
 */
export function AdminChatScreen({ report }: { report: AdminReport }) {
  const router = useRouter();

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button
          type="button"
          aria-label="뒤로"
          className="p-1"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-(--color-text-strong)">
            {report.reporterName} · {report.reportedName}
          </p>
          <p className="truncate text-xs text-(--color-text-sub)">
            신고 #{report.reportId} · 읽기 전용
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto bg-(--color-chat-bg) p-4">
        <InfoBox tone="info">
          신고 처리를 위해 열람 중입니다. 이 대화는 신고 검토 외의 목적으로
          쓰면 안 돼요.
        </InfoBox>

        {report.messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-(--color-text-sub)">
            주고받은 메시지가 없어요.
          </p>
        ) : (
          report.messages.map((message) => {
            const fromReported = message.sender === "reported";

            return (
              <div key={message.id} className="flex flex-col gap-1">
                <span className="text-xs text-(--color-text-sub)">
                  {fromReported ? report.reportedName : report.reporterName} ·{" "}
                  {message.sentAt}
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
