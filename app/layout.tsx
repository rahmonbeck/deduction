import type { Metadata } from "next";
import { Special_Elite, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const specialElite = Special_Elite({
  variable: "--font-typewriter",
  subsets: ["latin"],
  weight: "400",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEDUCTION — AI Detektiv Topishmoqlari",
  description: "AI generatsiya qilgan detektiv topishmoqlarni yeching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${specialElite.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}