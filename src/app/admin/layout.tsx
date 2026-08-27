"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@ui/공통/session";

const LOGIN_PATH = "/login";

/**
 * AUTH-04 — 관리자로 로그인하지 않았으면 관리자 페이지를 못 본다.
 *
 * 지금은 브라우저 세션만 보고 판단하는 목업이다. 서버가 붙으면 여기서
 * user.role을 실제로 조회해 막아야 한다.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session } = useSession();

  const allowed = session.role === "admin";

  useEffect(() => {
    if (!allowed) {
      router.replace(LOGIN_PATH);
    }
  }, [allowed, router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
