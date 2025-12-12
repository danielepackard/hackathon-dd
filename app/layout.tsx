import type { Metadata } from "next";
import { Inter } from "next/font/google";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "D&D Voice Agent",
    template: "%s | D&D Voice Agent",
  },
  description: "AI-powered Dungeon Master for your D&D campaigns - Elevenlabs hackathon project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
