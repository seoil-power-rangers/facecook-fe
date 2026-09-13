import type { Metadata, Viewport } from "next";
import { PwaBootstrap } from "@ui/공통/PwaBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "face 콕",
  description: "제52회 용마대동제 소개팅 부스 연계 웹서비스",
  applicationName: "face 콕",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  /**
   * 아이폰은 홈 화면에 추가된 PWA에서만 웹 푸시가 동작한다(기능명세 8절).
   * capable을 켜야 주소창 없는 전체화면으로 뜬다.
   */
  appleWebApp: {
    capable: true,
    title: "face 콕",
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
