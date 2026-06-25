import type { Metadata } from "next";
import { Dancing_Script, Geist, Geist_Mono } from "next/font/google";

import { AuthHydration } from "@/components/auth/auth-hydration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "A-Design Studio",
  description: "Project Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthHydration />
        {children}
      </body>
    </html>
  );
}