import type { Metadata } from "next";
import "./globals.css";
import {LanguageProvider} from './Language';

export const metadata: Metadata = {
  title: "个性化图灵测试标注平台",
  description: "参与金融与法律学术文本的盲测判断和证据标注。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
