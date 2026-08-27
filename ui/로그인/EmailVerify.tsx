"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@ui/공통/Button";
import TextField from "@ui/공통/TextField";
import StepHeader, { Accent } from "@ui/공통/StepHeader";
import InfoBox from "@ui/공통/InfoBox";
import { CODE_LENGTH, CODE_TTL_SECONDS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";

/** 02-email (STEP 1) — 6자리 인증번호, 5분 제한 */
export default function EmailVerify() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const [code, setCode] = useState("");
  const [left, setLeft] = useState<number | null>(null);

  const sent = left !== null;
  const expired = left === 0;

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = setInterval(() => setLeft((v) => (v ?? 0) - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const request = () => {
    // 서버가 붙기 전까지는 타이머만 돌린다.
    setCode("");
    setLeft(CODE_TTL_SECONDS);
  };

  const canSubmit =
    draft.email.includes("@") && code.length === CODE_LENGTH && !expired;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        step={1}
        title={
          <>
            <Accent>이메일</Accent>로 인증할게요
          </>
        }
        note="학교 이메일이 아니어도 돼요. 학번·학생증 없이 가입해요."
      />

      <div className="space-y-4">
        <TextField
          label="이메일"
          type="email"
          inputMode="email"
          placeholder="star2026@gmail.com"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
          trailing={
            <button
              type="button"
              onClick={request}
              disabled={!draft.email.includes("@")}
              className="shrink-0 text-[13px] font-bold text-primary disabled:text-muted"
            >
              {sent ? "재발송" : "인증요청"}
            </button>
          }
        />

        <div>
          <TextField
            label="인증번호"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            placeholder="000000"
            disabled={!sent}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="tracking-[0.3em]"
            trailing={
              sent ? (
                <span
                  className={`shrink-0 text-[13px] tabular-nums ${expired ? "text-danger" : "text-muted"}`}
                >
                  {formatLeft(left)}
                </span>
              ) : undefined
            }
          />
          <p
            className={`mt-1.5 text-[12px] ${expired ? "text-danger" : "text-muted"}`}
          >
            {expired
              ? "인증번호가 만료됐어요. 다시 받아주세요."
              : `메일함에서 ${CODE_LENGTH}자리 인증번호를 확인하세요`}
          </p>
        </div>

        <InfoBox>인증한 이메일로만 로그인할 수 있어요.</InfoBox>
      </div>

      <div className="mt-auto pt-8">
        <Button
          disabled={!canSubmit}
          onClick={() => router.push("/onboarding/terms")}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}

function formatLeft(sec: number | null) {
  const v = sec ?? 0;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}
