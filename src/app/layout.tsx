import type { Metadata, Viewport } from "next";
import { PwaBootstrap } from "@ui/공통/PwaBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "콕찔러보기",
  description: "제52회 용마대동제 소개팅 부스 연계 웹서비스",
  applicationName: "콕찔러보기",
  icons: {
    // 마스코트가 래스터 원본이라 SVG 판본은 두지 않는다.
    // 탭 아이콘은 src/app/favicon.ico(16/32/48)를 Next가 자동으로 붙인다.
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  /**
   * 아이폰은 홈 화면에 추가된 PWA에서만 웹 푸시가 동작한다(기능명세 8절).
   * capable을 켜야 주소창 없는 전체화면으로 뜬다.
   */
  appleWebApp: {
    capable: true,
    title: "콕찔러보기",
    statusBarStyle: "default",
  },
  other: {
    // Next는 표준 이름인 mobile-web-app-capable만 내보낸다. iOS 16.4부터는
    // 매니페스트의 display를 보므로 그걸로 충분하지만, 부스에 더 낮은 버전이
    // 올 수 있어서 애플 전용 옛 이름도 같이 둔다.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  // manifest.ts의 theme_color와 같은 값을 쓴다.
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  /**
   * 확대/축소를 막는다. PhoneFrame이 430px 고정 폭을 잡고 있어서 확대하면
   * 레이아웃이 그대로 어긋나고, 앱처럼 쓰라고 만든 화면에서 두 손가락으로
   * 벌어지면 부스에서 되돌릴 방법을 안내하기 어렵다.
   *
   * 다만 사파리는 브라우저 탭에서 이 설정을 무시한다(홈 화면에 추가된
   * PWA에서는 지킨다). 안드로이드·PC와 설치된 아이폰만 막힌다.
   */
  maximumScale: 1,
  userScalable: false,
  /*
   * 아이폰의 홈 인디케이터·노치 영역 크기를 env(safe-area-inset-*)로 받으려면
   * 화면 전체를 쓰겠다고 먼저 선언해야 한다. 이 값이 없으면 env()가 항상 0이라
   * 여백을 줘도 아무 효과가 없다.
   *
   * 대신 안전영역을 우리가 직접 비워야 하므로, PhoneFrame이 위아래 여백을 준다.
   */
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
