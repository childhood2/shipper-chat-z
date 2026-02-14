"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (status === "unauthenticated" && !isPublic) {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && (pathname === "/login" || pathname === "/register")) {
      router.replace("/chat");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background-bg-primary-cards)" }}>
        <span style={{ color: "var(--text-placeholder)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
