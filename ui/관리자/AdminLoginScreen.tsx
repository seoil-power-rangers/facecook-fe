"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@ui/공통/Button";
import { InfoBox } from "@ui/공통/InfoBox";
import { PhoneFrame } from "@ui/공통/PhoneFrame";
import { TextField } from "@ui/공통/TextField";
import { useSession } from "@ui/공통/session";

/**
 * AUTH-04 관리자 로그인 — 참가자 흐름(/)과 완전히 분리된 전용 로그인.
 *
 * 아이디·비밀번호를 서버에 확인하지 않는 목업이다. 지금은 둘 다 채우면
 * 통과한다 — 실제 검증은 서버가 붙을 때 session.ts의 signIn에서 처리한다.
 */
export function AdminLoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = adminId.trim().length > 0 && password.length > 0;

  const submit = () => {
    signIn({ role: "admin", name: adminId.trim() });
    router.push("/admin/dashboard");
  };

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-16">
        <div className="flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--color-primary-light) text-(--color-primary)">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-[22px] font-bold text-(--color-text-strong)">
            관리자 로그인
          </h1>
          <p className="mt-1.5 text-center text-[13px] text-(--color-text-sub)">
            부스 운영진 전용 페이지입니다.
          </p>
        </div>

        <form
          className="mt-9 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) {
              submit();
            }
          }}
        >
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
            계정은 총학생회에서 행사 전에 발급합니다. 비밀번호를 잊었다면
            운영 담당자에게 문의하세요.
          </InfoBox>

          <Button type="submit" fullWidth disabled={!canSubmit}>
            로그인
          </Button>
        </form>
      </div>
    </PhoneFrame>
  );
}
