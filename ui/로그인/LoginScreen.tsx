"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TextField } from "@ui/공통/TextField";
import { takeAuthNotice } from "@ui/공통/authSession";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, login } from "./authApi";

type LoginTab = "participant" | "admin";

const TABS: { key: LoginTab; label: string }[] = [
  { key: "participant", label: "참가자" },
  { key: "admin", label: "관리자" },
];

/**
 * 이미 가입한 사람이 다시 들어오는 화면. 약관·온보딩을 건너뛰고 바로 /main으로 간다.
 *
 * 참가자·관리자 둘 다 이메일(또는 아이디)+비밀번호로 들어온다 — 인증코드는
 * 최초 가입(이메일 인증) 때만 쓰고, 그 이후 로그인은 이 화면으로 통일한다.
 */
export function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>("participant");
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const noticeConsumed = useRef(false);

  useEffect(() => {
    // 세션 만료·정지로 튕겨져 온 경우, 그 사유를 한 번만 보여준다.
    // sessionStorage는 클라이언트에만 있어 서버 렌더와 값이 다를 수
    // 있으므로(하이드레이션 불일치 방지), 초기 상태가 아니라 마운트 후
    // 이펙트에서 읽는다. takeAuthNotice()는 읽자마자 지우는 1회성
    // 함수라, 개발 모드의 StrictMode 이중 실행에서 두 번째 호출이
    // null로 값을 덮어쓰지 않도록 ref로 한 번만 실행되게 막는다.
    if (noticeConsumed.current) return;
    noticeConsumed.current = true;
    setAuthNotice(takeAuthNotice());
  }, []);

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

        {authNotice ? (
          <div className="mt-4">
            <InfoBox tone="danger" icon={null}>
              {authNotice}
            </InfoBox>
          </div>
        ) : null}

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

/** 참가자 — 이메일+비밀번호로 로그인한다(가입할 때 설정한 비밀번호). */
function ParticipantForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && password.length > 0;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
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
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
        />

        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
        />

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
