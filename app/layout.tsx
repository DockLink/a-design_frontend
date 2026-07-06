import type { Metadata } from "next";
import { Toaster } from "sonner";

import { AuthHydration } from "@/components/auth/auth-hydration";
import { QueryProvider } from "@/components/providers/query-provider";
import { APP_NAME } from "@/lib/constants";
import { aktivGrotesk } from "@/lib/fonts/aktiv-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Project Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${aktivGrotesk.variable} ${aktivGrotesk.className} h-full antialiased`}>
      <body className="min-h-full">
        <QueryProvider>
          <AuthHydration />
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
