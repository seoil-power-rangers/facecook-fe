"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { CheckRow } from "@ui/공통/CheckRow";
import { InfoBox } from "@ui/공통/InfoBox";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TextField } from "@ui/공통/TextField";
import { CODE_LENGTH, EVENT, MIN_PASSWORD_LENGTH, TERMS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";
import { authErrorMessage, requestCode, verifySignup } from "./authApi";
import { useVerificationCode } from "./verificationCode";

const REQUIRED_TERM_IDS: string[] = TERMS.filter((term) => term.required).map(
  (term) => term.id,
);

/**
 * 02 인증 (STEP 1) — 6자리 인증번호 5분 제한 + 약관 동의.
 * 약관은 화면이 길어지지 않게 요약 한 줄만 두고 개별 항목은 바텀시트에서 받는다.
 */
export function EmailVerifyScreen() {
  const router = useRouter();
  const { draft, set, update } = useOnboarding();
  const { code, change, start, reset, sent, expired, filled, remaining } =
    useVerificationCode();
  const [termsOpen, setTermsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agreed = draft.agreedTerms;
  const requiredAgreed = REQUIRED_TERM_IDS.every((id) => agreed.includes(id));
  const allAgreed = agreed.length === TERMS.length;

  const toggleTerm = (id: string) =>
    update((prev) => ({
      ...prev,
      agreedTerms: prev.agreedTerms.includes(id)
        ? prev.agreedTerms.filter((value) => value !== id)
        : [...prev.agreedTerms, id],
    }));

  const toggleAllTerms = () =>
    update((prev) => ({
      ...prev,
      agreedTerms:
        prev.agreedTerms.length === TERMS.length
          ? []
          : TERMS.map((term) => term.id),
    }));

  /** 요약 줄은 필수 항목만 책임진다. 선택 항목은 바텀시트에서만 건드린다. */
  const toggleRequiredTerms = () =>
    update((prev) => {
      const on = REQUIRED_TERM_IDS.every((id) => prev.agreedTerms.includes(id));
      return {
        ...prev,
        agreedTerms: on
          ? prev.agreedTerms.filter((id) => !REQUIRED_TERM_IDS.includes(id))
          : [...new Set([...prev.agreedTerms, ...REQUIRED_TERM_IDS])],
      };
    });

  const passwordFilled = draft.password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit =
    draft.email.includes("@") &&
    filled &&
    !expired &&
    passwordFilled &&
    requiredAgreed;

  const changeEmail = (value: string) => {
    set("email", value);
    reset();
    setError(null);
  };

  const requestVerificationCode = async () => {
    if (!draft.email.includes("@") || isRequesting) return;

    setIsRequesting(true);
    setError(null);
    try {
      const response = await requestCode(draft.email, "signup");
      start(response.expiresInSeconds);
    } catch (requestError) {
      setError(authErrorMessage(requestError));
    } finally {
      setIsRequesting(false);
    }
  };

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await verifySignup(
        draft.email,
        code,
        draft.password,
        draft.agreedTerms,
      );
      router.push("/onboarding/basic");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onChange={(event) => changeEmail(event.target.value)}
          trailing={
            <button
              type="button"
              onClick={requestVerificationCode}
              disabled={!draft.email.includes("@") || isRequesting}
              className="shrink-0 text-[13px] font-bold text-(--color-primary) disabled:text-(--color-text-muted)"
            >
              {isRequesting ? "전송 중" : sent ? "재발송" : "인증요청"}
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
            onChange={(event) => change(event.target.value)}
            className="tracking-[0.3em]"
            trailing={
              sent ? (
                <span
                  className={`shrink-0 text-[13px] tabular-nums ${
                    expired ? "text-(--color-danger)" : "text-(--color-text-sub)"
                  }`}
                >
                  {remaining}
                </span>
              ) : undefined
            }
          />
          <p
            className={`mt-1.5 text-[12px] ${
              expired ? "text-(--color-danger)" : "text-(--color-text-sub)"
            }`}
          >
            {expired
              ? "인증번호가 만료됐어요. 다시 받아주세요."
              : `메일함에서 ${CODE_LENGTH}자리 인증번호를 확인하세요`}
          </p>
        </div>

        <TextField
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder={`${MIN_PASSWORD_LENGTH}자 이상 입력하세요`}
          value={draft.password}
          onChange={(event) => set("password", event.target.value)}
        />

        <InfoBox>인증한 이메일로만 로그인할 수 있어요.</InfoBox>

        {error ? (
          <p role="alert" className="text-[12px] text-(--color-danger)">
            {error}
          </p>
        ) : null}

        <div className="rounded-(--radius-md) bg-(--color-primary-light) px-3.5">
          <CheckRow
            checked={requiredAgreed}
            onToggle={toggleRequiredTerms}
            label="이용약관·개인정보 수집에 동의"
            trailing={
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                aria-label="약관 항목 자세히 보기"
                className="flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-(--color-primary)"
              >
                보기
                <ChevronRight className="h-4 w-4" />
              </button>
            }
          >
            이용약관·개인정보 수집에 동의합니다
          </CheckRow>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          fullWidth
          disabled={!canSubmit || isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "확인 중..." : "동의하고 시작하기"}
        </Button>
      </div>

      <BottomSheet open={termsOpen} onClose={() => setTermsOpen(false)}>
        <div className="px-5 pt-3">
          <h2 className="text-[17px] font-bold text-(--color-text-strong)">
            약관에 동의해주세요
          </h2>

          <div className="mt-4 rounded-(--radius-md) bg-(--color-primary-light) px-3.5 py-1">
            <CheckRow
              checked={allAgreed}
              onToggle={toggleAllTerms}
              label="전체 동의"
            >
              <b
                className={`font-bold ${
                  allAgreed
                    ? "text-(--color-primary)"
                    : "text-(--color-text-sub)"
                }`}
              >
                전체 동의
              </b>
            </CheckRow>
          </div>

          <div className="mt-3 space-y-0.5 px-1">
            {TERMS.map((term) => (
              <CheckRow
                key={term.id}
                checked={agreed.includes(term.id)}
                onToggle={() => toggleTerm(term.id)}
                label={`${term.required ? "필수" : "선택"} ${term.label} 동의`}
                trailing={
                  <button
                    type="button"
                    aria-label={`${term.label} 전문 보기`}
                    className="shrink-0 text-(--color-border-strong)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                }
              >
                <b className="font-bold text-(--color-primary)">
                  [{term.required ? "필수" : "선택"}]
                </b>{" "}
                {term.label}
              </CheckRow>
            ))}
          </div>

          <div className="mt-5">
            <InfoBox icon={null}>
              <b className="mb-1 block font-bold text-(--color-text-strong)">
                데이터 보관 안내
              </b>
              프로필·콕 기록은 매일 초기화돼요.
              <br />
              모든 데이터는 {EVENT.purgeAt}에 삭제됩니다.
            </InfoBox>
          </div>

          <div className="mt-5">
            <Button
              fullWidth
              disabled={!requiredAgreed}
              onClick={() => setTermsOpen(false)}
            >
              확인
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
