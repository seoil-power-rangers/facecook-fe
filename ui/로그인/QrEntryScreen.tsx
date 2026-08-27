"use client";

import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { EVENT } from "@ui/공통/constants";

/** 01 QR 진입 — QR로 들어온 첫 화면. 진행바 없음. */
export function QrEntryScreen() {
  const router = useRouter();

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        <p className="text-center text-[12px] font-bold text-(--color-primary)">
          STAR 총학생회
        </p>

        <div className="flex flex-1 flex-col items-center justify-center">
          <CursorMark />

          <h1 className="mt-8 text-[26px] font-bold text-(--color-text-strong)">
            마음이 가면, 콕.
          </h1>
          <p className="mt-2 text-[14px] text-(--color-text-sub)">
            서로 콕하면 그때 매칭돼요.
          </p>

          <div className="mt-9 flex w-full items-center gap-3 rounded-(--radius-md) bg-(--color-primary-light) px-4 py-3.5">
            <QrCode className="h-6 w-6 shrink-0 text-(--color-primary)" />
            <span className="text-[13px] leading-snug">
              <b className="font-bold text-(--color-primary)">QR로 입장했어요</b>
              <br />
              <span className="text-(--color-text-sub)">
                {EVENT.name} · {EVENT.period}
              </span>
            </span>
          </div>

          <p className="mt-7 text-center text-[13px] leading-relaxed text-(--color-text-sub)">
            이메일 인증만 하면 바로 시작돼요.
            <br />
            학번·학생증은 필요 없어요.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button fullWidth onClick={() => router.push("/onboarding/email")}>
            이메일로 시작하기
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push("/onboarding/email")}
          >
            이미 가입했어요 · 로그인
          </Button>
          <p className="pt-1 text-center text-[11px] text-(--color-text-muted)">
            가입 시 이용약관·개인정보 처리방침에 동의합니다
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** 시안의 커서 일러스트. 총학생회 로고가 오면 교체한다. */
function CursorMark() {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
      <circle cx="26" cy="30" r="6" fill="var(--color-primary)" opacity="0.3" />
      <circle cx="95" cy="26" r="9" fill="var(--color-primary)" opacity="0.25" />
      <circle cx="30" cy="92" r="5" fill="var(--color-primary)" opacity="0.2" />
      <path
        d="M44 26 L86 62 L66 66 L74 92 L62 96 L54 70 L40 82 Z"
        fill="var(--color-primary)"
      />
    </svg>
  );
}
