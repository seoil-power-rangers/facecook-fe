"use client";

import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import { QrIcon } from "@ui/공통/icons";
import { EVENT } from "@ui/공통/constants";

/** 01-qr-entry — QR로 들어온 첫 화면. 진행바 없음. */
export default function QrEntry() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-14">
      <p className="text-center text-[12px] font-bold text-primary">
        STAR 총학생회
      </p>

      <div className="flex flex-1 flex-col items-center justify-center">
        <Cursor />
        <h1 className="mt-8 text-[26px] font-bold">마음이 가면, 콕.</h1>
        <p className="mt-2 text-[14px] text-muted">서로 콕하면 그때 매칭돼요.</p>

        <div className="mt-9 flex w-full items-center gap-3 rounded-xl bg-primary-soft px-4 py-3.5">
          <span className="h-6 w-6 shrink-0 text-primary">
            <QrIcon />
          </span>
          <span className="text-[13px] leading-snug">
            <b className="font-bold text-primary">QR로 입장했어요</b>
            <br />
            <span className="text-muted">
              {EVENT.name} · {EVENT.period}
            </span>
          </span>
        </div>

        <p className="mt-7 text-center text-[13px] leading-relaxed text-muted">
          이메일 인증만 하면 바로 시작돼요.
          <br />
          학번·학생증은 필요 없어요.
        </p>
      </div>

      <div className="space-y-2.5">
        <Button onClick={() => router.push("/onboarding/email")}>
          이메일로 시작하기
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push("/onboarding/email")}
        >
          이미 가입했어요 · 로그인
        </Button>
        <p className="pt-1 text-center text-[11px] text-muted">
          가입 시 이용약관·개인정보 처리방침에 동의합니다
        </p>
      </div>
    </div>
  );
}

/** 시안의 커서 일러스트. 총학생회 로고가 오면 교체한다. */
function Cursor() {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
      <circle cx="26" cy="30" r="6" className="fill-primary/30" />
      <circle cx="95" cy="26" r="9" className="fill-primary/25" />
      <circle cx="30" cy="92" r="5" className="fill-primary/20" />
      <path
        d="M44 26 L86 62 L66 66 L74 92 L62 96 L54 70 L40 82 Z"
        className="fill-primary"
      />
    </svg>
  );
}
