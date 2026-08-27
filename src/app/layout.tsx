import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "face 콕",
  description: "제52회 용마대동제 소개팅 부스 연계 웹서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
