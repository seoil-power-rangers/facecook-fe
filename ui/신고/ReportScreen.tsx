"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Flag, X } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { SelectCard } from "@ui/공통/SelectCard";
import {
  getProfile,
  profileErrorMessage,
  type ProfileResponse,
} from "@ui/프로필작성/profileApi";
import { createReport, reportErrorMessage } from "./reportApi";

const REPORT_REASONS = [
  "부적절한 프로필·사진",
  "불쾌하거나 위협적인 행동",
  "사칭·허위 정보",
  "스팸·외부 홍보",
  "기타",
];

export function ReportScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const numericUserId = Number(userId);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      setLoadError("올바르지 않은 프로필 주소예요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      setProfile(await getProfile(numericUserId));
    } catch (error) {
      setLoadError(profileErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [numericUserId]);

  useEffect(() => {
    // 라우트의 userId가 바뀌면 신고 대상 프로필을 다시 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = async () => {
    if (!profile || !reason || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const trimmedDetail = detail.trim();
      await createReport({
        reportedUserId: profile.userId,
        reason,
        ...(trimmedDetail ? { detail: trimmedDetail } : {}),
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(reportErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadError || !profile) {
    return (
      <PhoneFrame>
        <ReportHeader onClose={() => router.back()} />
        <div
          role={loadError ? "alert" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm ${
            loadError ? "text-(--color-danger)" : "text-(--color-text-sub)"
          }`}
        >
          <span>{loadError ?? "신고 대상 정보를 불러오는 중..."}</span>
          {loadError ? (
            <Button size="sm" variant="outline" onClick={() => void loadProfile()}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </PhoneFrame>
    );
  }

  if (isSubmitted) {
    return (
      <PhoneFrame>
        <ReportHeader onClose={() => router.replace(`/profile/${profile.userId}`)} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <CircleCheck className="h-12 w-12 text-(--color-primary)" aria-hidden="true" />
          <h2 className="text-lg font-bold text-(--color-text-strong)">신고가 접수됐어요</h2>
          <p className="text-sm text-(--color-text-sub)">관리자가 내용을 확인할 예정이에요.</p>
        </main>
        <div className="shrink-0 border-t border-(--color-border) bg-(--color-surface) p-4">
          <Button fullWidth onClick={() => router.replace(`/profile/${profile.userId}`)}>
            프로필로 돌아가기
          </Button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <ReportHeader onClose={() => router.back()} />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-(--radius-lg) bg-(--color-surface-alt) p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-primary-lighter) text-base font-bold text-(--color-primary)">
              {profile.nickname.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-(--color-text-strong)">{profile.nickname}</span>
              <span className="text-xs text-(--color-text-sub)">이 참가자를 신고합니다</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-(--color-text-strong)">신고 사유</p>
            {REPORT_REASONS.map((item) => (
              <SelectCard
                key={item}
                label={item}
                selected={reason === item}
                onSelect={() => {
                  if (!isSubmitting) setReason(item);
                }}
              />
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
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-base text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted)"
            />
            <span className="self-end text-xs text-(--color-text-muted)">{detail.length}/1000</span>
          </div>

          <div className="flex items-start gap-2 rounded-(--radius-lg) bg-(--color-danger-light) p-3">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-(--color-danger)" aria-hidden="true" />
            <p className="text-xs text-(--color-danger)">관리자가 검토 후 이용정지를 진행할 수 있습니다.</p>
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t border-(--color-border) bg-(--color-surface) p-4">
        {submitError ? (
          <p role="alert" className="mb-3 text-center text-sm text-(--color-danger)">
            {submitError}
          </p>
        ) : null}
        <Button fullWidth disabled={!reason || isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? "접수 중..." : "신고 접수"}
        </Button>
      </div>
    </PhoneFrame>
  );
}

function ReportHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-(--color-border) bg-(--color-surface) px-3">
      <button type="button" aria-label="닫기" className="p-1" onClick={onClose}>
        <X className="h-5 w-5 text-(--color-text-strong)" />
      </button>
      <h1 className="flex-1 text-center text-base font-bold text-(--color-text-strong)">신고하기</h1>
      <span className="w-7" aria-hidden="true" />
    </header>
  );
}
