"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { BottomSheet } from "@ui/공통/BottomSheet";
import { CheckRow } from "@ui/공통/CheckRow";
import { CodeInput } from "@ui/공통/CodeInput";
import { InfoBox } from "@ui/공통/InfoBox";
import { StepFooter } from "@ui/공통/StepFooter";
import { StepHeader, Accent } from "@ui/공통/StepHeader";
import { TextField } from "@ui/공통/TextField";
import { CODE_LENGTH, EVENT, MIN_PASSWORD_LENGTH, TERMS } from "@ui/공통/constants";
import { useOnboarding } from "@ui/공통/onboarding";
import {
  AuthApiError,
  authErrorMessage,
  requestCode,
  verifySignup,
} from "./authApi";
import { useVerificationCode } from "./verificationCode";
import { track } from "@ui/공통/analytics";

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
  /*
   * 서버가 인증번호를 거절했는지. 화면에서는 6자리를 다 채운 정상 입력처럼
   * 보이므로, 틀렸다는 걸 칸 자체에도 표시해야 어디를 고쳐야 할지 보인다.
   *
   * 오류 코드 이름에 CODE가 들어가는 경우만 인증번호 문제로 본다 — 명세에
   * 정확한 코드가 적혀 있지 않아서, 다르면 칸이 빨개지지 않을 뿐 동작은 그대로다.
   * facecook-be에 코드 이름을 확인해서 이 조건을 좁히는 게 좋다.
   */
  const [codeRejected, setCodeRejected] = useState(false);

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

  const emailFilled = draft.email.includes("@");
  const passwordFilled = draft.password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit =
    emailFilled && filled && !expired && passwordFilled && requiredAgreed;

  /** 아직 안 끝난 것 중 맨 위 것 하나만 말한다 — 전부 나열하면 읽지 않는다. */
  const missing = !emailFilled
    ? "이메일 주소를 입력해주세요"
    : !sent
      ? "인증요청을 눌러 인증번호를 받아주세요"
      : expired
        ? "인증번호가 만료됐어요. 다시 받아주세요"
        : !filled
          ? `인증번호 ${CODE_LENGTH}자리를 입력해주세요`
          : !passwordFilled
            ? `비밀번호를 ${MIN_PASSWORD_LENGTH}자 이상 입력해주세요`
            : !requiredAgreed
              ? "약관에 동의해야 시작할 수 있어요"
              : undefined;

  const changeEmail = (value: string) => {
    set("email", value);
    reset();
    setCodeRejected(false);
    setError(null);
  };

  /** 고치기 시작하면 거절 표시를 지운다 — 계속 빨간 채로 두면 뭘 고쳤는지 안 보인다. */
  const changeCode = (value: string) => {
    change(value);
    setCodeRejected(false);
  };

  const requestVerificationCode = async () => {
    if (!draft.email.includes("@") || isRequesting) return;

    setIsRequesting(true);
    setError(null);
    try {
      const response = await requestCode(draft.email, "signup");
      track({ name: "signup_code_requested" });
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
      // 호출 뒤에 남긴다. 앞에 두면 코드를 틀려 실패한 시도까지 "인증됨"으로
      // 세어져서, 퍼널에서 코드 때문에 막힌 사람이 보이지 않는다.
      track({ name: "signup_verified" });
      router.push("/onboarding/basic");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
      setCodeRejected(
        submitError instanceof AuthApiError && submitError.code.includes("CODE"),
      );
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

      <div className="space-y-5">
        <TextField
          label="이메일"
          type="email"
          inputMode="email"
          placeholder="star2026@gmail.com"
          value={draft.email}
          onChange={(event) => changeEmail(event.target.value)}
          trailing={
            /*
             * 이 화면에서 제일 먼저 눌러야 하는 곳이다. 칸 안의 작은 글씨로
             * 두면 버튼인지 안내인지 구분이 안 돼서 알약으로 올린다.
             * 한 번 보낸 뒤에는 테두리만 남겨 주인공 자리를 인증번호에 넘긴다.
             */
            <button
              type="button"
              onClick={requestVerificationCode}
              disabled={!emailFilled || isRequesting}
              className={`flex h-8 shrink-0 items-center rounded-(--radius-full) border px-3 text-[12.5px] font-bold transition-colors disabled:border-(--color-disabled-border) disabled:bg-transparent disabled:text-(--color-disabled-text) ${
                sent
                  ? "border-(--color-primary) text-(--color-primary)"
                  : "border-(--color-primary) bg-(--color-primary) text-(--color-text-on-primary)"
              }`}
            >
              {isRequesting ? "전송 중" : sent ? "재발송" : "인증요청"}
            </button>
          }
        />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-bold text-(--color-text-sub)">
              인증번호
            </p>
            {sent ? (
              <span
                className={`text-[11.5px] font-bold tabular-nums ${
                  expired ? "text-(--color-danger)" : "text-(--color-primary)"
                }`}
              >
                {remaining}
              </span>
            ) : null}
          </div>

          <CodeInput
            label="인증번호"
            length={CODE_LENGTH}
            value={code}
            onChange={changeCode}
            disabled={!sent}
            invalid={expired || codeRejected}
          />

          <p
            className={`mt-1.5 text-[12px] ${
              expired ? "text-(--color-danger)" : "text-(--color-text-sub)"
            }`}
          >
            {!sent
              ? "인증요청을 누르면 메일이 가요"
              : expired
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

      {/* 오류는 방금 누른 버튼 옆에 둔다 — 본문 가운데 있으면 스크롤 위치에 따라 못 본다. */}
      <StepFooter
        hint={
          error ? (
            <span role="alert" className="text-(--color-danger)">
              {error}
            </span>
          ) : (
            missing
          )
        }
      >
        <Button
          fullWidth
          disabled={!canSubmit || isSubmitting}
          onClick={submit}
        >
          {isSubmitting ? "확인 중..." : "동의하고 시작하기"}
        </Button>
      </StepFooter>

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
