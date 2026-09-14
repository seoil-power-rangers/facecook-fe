import type { MetadataRoute } from "next";

/**
 * PWA 매니페스트. Next가 /manifest.webmanifest로 서빙하고 <link rel="manifest">도
 * 자동으로 넣어준다.
 *
 * 부스 참가자가 "홈 화면에 추가"로 설치할 수 있어야 하는 이유는 기능명세 8절에
 * 있다 — 아이폰은 PWA로 설치돼 있어야 웹 푸시를 받을 수 있다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "페이스콕",
    short_name: "페이스콕",
    description: "제52회 용마대동제 소개팅 부스 연계 웹서비스",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // 화면 대부분이 흰 헤더로 시작한다. 보라(--color-primary)로 두면 상단에
    // 띠가 생겨서 어긋나 보인다.
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // 안드로이드가 바깥쪽을 잘라내도 글리프가 살아남게 여백을 둔 판본.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
