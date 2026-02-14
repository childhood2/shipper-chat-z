"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background-bg-primary-cards)",
        padding: 24,
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "var(--text-neutral-main)",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Shipper Chat
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "var(--text-placeholder)",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Welcome. Sign in to start messaging.
      </p>
      <Link
        href="/login"
        style={{
          display: "inline-block",
          padding: "14px 28px",
          borderRadius: "var(--radius-10)",
          background: "var(--semantic-brand-500)",
          color: "var(--icon-neutral-white)",
          fontSize: 16,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Access Portal
      </Link>
    </div>
  );
}
