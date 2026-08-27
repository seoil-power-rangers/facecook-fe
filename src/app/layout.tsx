import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "face 콕",
  description: "제52회 용마대동제 소개팅 부스 연계 웹서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        {/* 시안 프레임이 380px 폭이라 그 안으로 가둔다. */}
        <div className="mx-auto min-h-dvh w-full max-w-[380px] bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
