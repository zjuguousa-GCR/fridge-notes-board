import type { Metadata } from "next";
import { Geist, Geist_Mono, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 中文手写体，用于便签文字
const maShanZheng = Ma_Shan_Zheng({
  variable: "--font-ma-shan-zheng",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家庭留言贴",
  description: "家庭电冰箱留言贴，随时随地给家人留言",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${maShanZheng.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
