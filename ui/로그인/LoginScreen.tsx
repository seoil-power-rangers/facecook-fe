"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TextField } from "@ui/공통/TextField";
import { EVENT } from "@ui/공통/constants";
import { useSession } from "@ui/공통/session";
import { authErrorMessage, login } from "./authApi";

type LoginTab = "participant" | "admin";

/**
 * 이미 가입한 사람이 다시 들어오는 화면. 약관·온보딩을 건너뛰고 바로 /main으로 간다.
 *
 * 참가자·관리자 둘 다 이메일(또는 아이디)+비밀번호로 들어온다 — 인증코드는
 * 최초 가입(이메일 인증) 때만 쓰고, 그 이후 로그인은 이 화면으로 통일한다.
 *
 * 관리자를 탭이 아니라 맨 아래 링크로 내린 이유는 인원 차이다. 참가자는
 * 300명이고 운영진은 몇 명뿐이라, 둘을 나란히 놓으면 300명이 매번 "나는
 * 참가자" 를 고르고 들어가야 한다.
 */
export function LoginScreen() {
  const [tab, setTab] = useState<LoginTab>("participant");
  const isAdmin = tab === "admin";

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col bg-(--color-primary-lighter)">
        {/*
          앱의 첫 화면이라 뒤로가기를 두지 않는다. 설치된 PWA에는 브라우저
          뒤로가기도 없어서, 버튼을 두면 돌아갈 곳 없이 눌리기만 한다.
        */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-10 pt-10">
          <div className="flex flex-1 flex-col justify-center py-2">
            <AppMark />

            <div className="mt-8">
              {isAdmin ? <AdminForm /> : <ParticipantForm />}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setTab(isAdmin ? "participant" : "admin")}
              className="text-[13px] font-semibold text-(--color-text-sub) underline underline-offset-4"
            >
              {isAdmin ? "참가자 로그인으로" : "운영진이신가요? 관리자 로그인"}
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** 앱 아이콘 + 워드마크. 아이콘은 홈 화면에 설치됐을 때와 같은 그림을 쓴다. */
function AppMark() {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-5 text-[13px] font-semibold text-(--color-text-sub)">
        제52회 용마대동제 · {EVENT.period}
      </p>

      <div className="overflow-hidden rounded-[1.75rem] bg-(--color-surface) p-2 shadow-(--shadow-card)">
        {/* 정적 파일이라 next/image의 최적화가 필요 없다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt="페이스콕"
          className="h-28 w-28 rounded-[1.25rem] object-contain"
        />
      </div>

      <p className="mt-5 text-[30px] font-bold leading-none tracking-tight text-(--color-text-strong)">
        페이스<span className="text-(--color-accent)">콕</span>
      </p>
      <p className="mt-2.5 text-[14px] text-(--color-text-sub)">
        마음이 가면, 콕.
      </p>
    </div>
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
    <>
      <form
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
            tone="soft"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
          />

          <TextField
            label="비밀번호"
            tone="soft"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
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

        <Button
          type="submit"
          fullWidth
          className="mt-7 rounded-(--radius-full)"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      {/*
        가입 경로. form 안에 두면 type을 지정해도 엔터 한 번에 눌릴 여지가
        있어서 밖으로 뺀다.
      */}
      <Button
        type="button"
        variant="secondary"
        fullWidth
        className="mt-3 rounded-(--radius-full)"
        onClick={() => router.push("/onboarding/email")}
      >
        이메일로 시작하기
      </Button>
    </>
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
          tone="soft"
          autoComplete="username"
          placeholder="admin"
          value={adminId}
          onChange={(event) => setAdminId(event.target.value)}
        />

        <TextField
          label="비밀번호"
          tone="soft"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <InfoBox>
          부스 운영진 전용입니다. 계정은 총학생회에서 행사 전에 발급해요.
        </InfoBox>
      </div>

      <Button
        type="submit"
        fullWidth
        className="mt-7 rounded-(--radius-full)"
        disabled={!canSubmit}
      >
        로그인
      </Button>
    </form>
  );
}
