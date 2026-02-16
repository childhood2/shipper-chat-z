"use client";

import { SessionProvider } from "next-auth/react";
import { AuthGate } from "@/components/auth/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGate>{children}</AuthGate>
    </SessionProvider>
  );
}
