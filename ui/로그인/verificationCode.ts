"use client";

import { useEffect, useState } from "react";
import { CODE_LENGTH, CODE_TTL_SECONDS } from "@ui/공통/constants";

/**
 * 이메일 인증번호 입력 상태. 신규 가입(02 인증)과 재로그인(/login)이
 * 같은 규칙을 쓰므로 한 군데에 둔다.
 *
 * 서버가 인증코드 발송에 성공하면 응답의 TTL로 타이머를 시작한다.
 */
export function useVerificationCode() {
  const [code, setCode] = useState("");
  const [left, setLeft] = useState<number | null>(null);

  const sent = left !== null;
  const expired = left === 0;
  const filled = code.length === CODE_LENGTH;

  useEffect(() => {
    if (left === null || left <= 0) {
      return;
    }
    const id = setInterval(() => setLeft((value) => (value ?? 0) - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const start = (ttlSeconds = CODE_TTL_SECONDS) => {
    setCode("");
    setLeft(ttlSeconds);
  };

  const reset = () => {
    setCode("");
    setLeft(null);
  };

  const change = (value: string) => setCode(value.replace(/\D/g, ""));

  const remaining = formatLeft(left);

  return { code, change, start, reset, sent, expired, filled, remaining };
}

function formatLeft(seconds: number | null) {
  const value = seconds ?? 0;
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const rest = String(value % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
