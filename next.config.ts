import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // 서비스 종료 시각(facecook-fe#127). Vercel에는 서버 변수 SERVICE_END_AT 하나만 둔다 — proxy는 실행할 때,
    // 화면 코드(ServiceEndWatcher)는 빌드할 때 이 값을 읽는다.
    NEXT_PUBLIC_SERVICE_END_AT: process.env.SERVICE_END_AT ?? "",
  },
};

export default nextConfig;
