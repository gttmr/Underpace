import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "동호회 모임 신청",
  description: "스포츠 동호회 주간 모임 참가 신청 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-100">
        {children}
      </body>
    </html>
  );
}
