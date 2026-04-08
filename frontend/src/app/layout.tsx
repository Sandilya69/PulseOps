import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseOps | Intelligent CRM & API Monitor",
  description: "Monitor your APIs, handle incidents, and manage your team from one cinematic dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-command antialiased">
        <Providers>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
