"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, X } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { SelectCard } from "@ui/공통/SelectCard";

const REPORT_REASONS = [
  "부적절한 프로필·사진",
  "불쾌하거나 위협적인 행동",
  "사칭·허위 정보",
  "스팸·외부 홍보",
  "기타",
];

export function ReportScreen({ targetName }: { targetName: string }) {
  const router = useRouter();
  const [reason, setReason] = useState<string | null>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");

  return (
    <PhoneFrame>
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
        <button type="button" aria-label="닫기" className="p-1" onClick={() => router.back()}>
          <X className="h-5 w-5 text-(--color-text-strong)" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-(--color-text-strong)">신고하기</h1>
        <span className="w-7" aria-hidden="true" />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-surface-alt) p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-primary-lighter) text-base font-bold text-(--color-primary)">
              {targetName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-(--color-text-strong)">{targetName}</span>
              <span className="text-xs text-(--color-text-sub)">이 참가자를 신고합니다</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-(--color-text-strong)">신고 사유</p>
            {REPORT_REASONS.map((item) => (
              <SelectCard key={item} label={item} selected={reason === item} onSelect={() => setReason(item)} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-(--color-text-strong)">
              상세 내용 <span className="font-normal text-(--color-text-muted)">(선택)</span>
            </p>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="어떤 일이 있었는지 적어주세요"
              rows={4}
              className="resize-none rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted)"
            />
          </div>

          <div className="flex items-start gap-2 rounded-(--radius-lg) bg-(--color-danger-light) p-3">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-(--color-danger)" aria-hidden="true" />
            <p className="text-xs text-(--color-danger)">관리자가 검토 후 이용정지를 진행할 수 있습니다.</p>
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t border-(--color-border) bg-(--color-surface) p-4">
        <Button fullWidth disabled={!reason} onClick={() => router.back()}>
          신고 접수
        </Button>
      </div>
    </PhoneFrame>
  );
}
