"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TextField } from "@ui/공통/TextField";
import { takeAuthNotice } from "@ui/공통/authSession";
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
  const router = useRouter();
  const { session } = useSession();
  const [tab, setTab] = useState<LoginTab>("participant");
  const isAdmin = tab === "admin";
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const noticeConsumed = useRef(false);

  /*
   * 이미 로그인한 사람은 로그인 화면을 볼 이유가 없다.
   *
   * 인증은 서버가 준 HttpOnly 쿠키가 하고 그 쿠키는 7일 살아 있는데, 앱을
   * 껐다 켜면 여기서 무조건 로그인 화면을 띄우고 있었다. 쿠키를 JS로는 읽을
   * 수 없으니, 로그인할 때 남겨둔 이름표를 보고 판단한다.
   *
   * 이름표가 낡아서(쿠키가 먼저 만료) 잘못 들여보내도 괜찮다 — 들어간
   * 화면의 RequireProfile이 서버에 확인하고 다시 내보낸다. 그 드문 경우
   * 때문에 매번 서버 응답을 기다리며 빈 화면을 띄우지는 않는다.
   */
  const isReturning = session.role !== "guest";

  useEffect(() => {
    if (session.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (session.role === "participant") {
      router.replace("/main");
    }
  }, [session.role, router]);

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

  if (isReturning) {
    return null;
  }

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

            {authNotice ? (
              <div className="mt-6">
                <InfoBox tone="danger" icon={null}>
                  {authNotice}
                </InfoBox>
              </div>
            ) : null}

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

/** AUTH-04 관리자 — 서버에 아이디·비밀번호를 확인하고 세션 쿠키를 받는다. */
function AdminForm() {
  const router = useRouter();
  const { signIn } = useSession();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = adminId.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(adminId, password);
      if (user.role !== "admin") {
        setError("관리자 권한이 없는 계정입니다.");
        return;
      }
      signIn({ role: "admin", name: user.email });
      router.push("/admin/dashboard");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          label="아이디"
          tone="soft"
          autoComplete="username"
          placeholder="seoiladmin@facecook.ac.kr"
          value={adminId}
          onChange={(event) => {
            setAdminId(event.target.value);
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

        <InfoBox>
          부스 운영진 전용입니다. 계정은 총학생회에서 행사 전에 발급해요.
        </InfoBox>

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
  );
}
