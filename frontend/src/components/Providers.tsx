"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryProvider } from '@/providers/QueryProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  if (!clientId || clientId === "") {
    console.warn("Google Client ID not found. OAuth disabled.");
    return <QueryProvider><RealtimeProvider>{children}</RealtimeProvider></QueryProvider>;
  }

  return (
    <QueryProvider>
      <RealtimeProvider>
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
      </RealtimeProvider>
    </QueryProvider>
  );
}
