"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TextField } from "@ui/공통/TextField";
import { CODE_LENGTH } from "@ui/공통/constants";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, requestCode, verifyLogin } from "./authApi";
import { useVerificationCode } from "./verificationCode";

type LoginTab = "participant" | "admin";

const TABS: { key: LoginTab; label: string }[] = [
  { key: "participant", label: "참가자" },
  { key: "admin", label: "관리자" },
];

/**
 * 이미 가입한 사람이 다시 들어오는 화면. 약관·온보딩을 건너뛰고 바로 /main으로 간다.
 *
 * AUTH-02가 참가자 로그인을 이메일 인증으로 정해두어 관리자(아이디+비밀번호)와
 * 입력 방식이 다르다. 그래서 한 화면에 두되 탭으로 갈라둔다.
 */
export function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("participant");

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="-ml-1 mb-6 text-(--color-text-strong)"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <h1 className="text-[22px] font-bold leading-snug text-(--color-text-strong)">
          다시 오셨네요
        </h1>
        <p className="mt-1.5 text-[13px] text-(--color-text-sub)">
          가입할 때 쓴 계정으로 들어오세요.
        </p>

        <div
          role="tablist"
          aria-label="로그인 방식"
          className="mt-6 flex gap-2 rounded-(--radius-md) bg-(--color-surface-alt) p-1"
        >
          {TABS.map((item) => {
            const on = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(item.key)}
                className={`h-9 flex-1 rounded-(--radius-sm) text-[13px] font-bold transition-colors ${
                  on
                    ? "bg-(--color-surface) text-(--color-primary) shadow-(--shadow-card)"
                    : "text-(--color-text-sub)"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-1 flex-col">
          {tab === "participant" ? <ParticipantForm /> : <AdminForm />}
        </div>
      </div>
    </PhoneFrame>
  );
}

/** 참가자 — AUTH-02, 이메일 인증으로 로그인한다. */
function ParticipantForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const { code, change, start, reset, sent, expired, filled, remaining } =
    useVerificationCode();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailFilled = email.includes("@");
  const canSubmit = emailFilled && filled && !expired;

  const changeEmail = (value: string) => {
    setEmail(value);
    reset();
    setError(null);
  };

  const requestVerificationCode = async () => {
    if (!emailFilled || isRequesting) return;

    setIsRequesting(true);
    setError(null);
    try {
      const response = await requestCode(email, "login");
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
      const user = await verifyLogin(email, code);
      signIn({ role: "participant", name: user.email });
      router.push("/main");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          void submit();
        }
      }}
    >
      <div className="space-y-4">
        <TextField
          label="이메일"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="star2026@gmail.com"
          value={email}
          onChange={(event) => changeEmail(event.target.value)}
          trailing={
            <button
              type="button"
              onClick={requestVerificationCode}
              disabled={!emailFilled || isRequesting}
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
              : `가입할 때 인증한 이메일로 ${CODE_LENGTH}자리 번호를 보내요`}
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-[12px] text-(--color-danger)">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </div>
    </form>
  );
}

/** AUTH-04 관리자 — 참가자와 다른 계정 체계로 들어온다. */
function AdminForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = adminId.trim().length > 0 && password.length > 0;

  const submit = () => {
    // 서버가 붙으면 여기서 user.role을 실제로 조회해야 한다.
    signIn({ role: "admin", name: adminId.trim() });
    router.push("/admin/dashboard");
  };

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          submit();
        }
      }}
    >
      <div className="space-y-4">
        <TextField
          label="아이디"
          autoComplete="username"
          placeholder="admin"
          value={adminId}
          onChange={(event) => setAdminId(event.target.value)}
        />

        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <InfoBox>
          부스 운영진 전용입니다. 계정은 총학생회에서 행사 전에 발급해요.
        </InfoBox>
      </div>

      <div className="mt-auto pt-8">
        <Button type="submit" fullWidth disabled={!canSubmit}>
          로그인
        </Button>
      </div>
    </form>
  );
}
