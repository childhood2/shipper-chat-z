"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      router.replace("/chat");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  function handleGoogle() {
    setError("");
    signIn("google", { callbackUrl: "/chat" });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background-bg-primary-cards)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--icon-neutral-white)",
          borderRadius: "var(--radius-16)",
          boxShadow: "var(--shadow-popup)",
          border: "1px solid var(--border-border-primary)",
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-neutral-main)",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-placeholder)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Sign in to your account to continue.
        </p>
        {registered && (
          <p
            style={{
              fontSize: 13,
              color: "var(--semantic-success-500)",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Account created. Sign in below.
          </p>
        )}
        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "var(--radius-10)",
            border: "1px solid var(--border-border-primary)",
            background: "var(--icon-neutral-white)",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-neutral-main)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.2 7.2 0 0 0 2.23-5.05z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.82 4.8 4.8 0 0 1-4.53-3.3H1.67v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.45 10.58a4.8 4.8 0 0 1 0-3.16V5.35H1.67a8 8 0 0 0 0 7.28l2.78-2.05z"/>
            <path fill="#EA4335" d="M8.98 4.42c1.2 0 2.27.41 3.1 1.2l2.31-2.31A8 8 0 0 0 1.67 5.35l2.78 2.07a4.8 4.8 0 0 1 4.53-3z"/>
          </svg>
          Continue with Google
        </button>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-10)",
              border: "1px solid var(--border-border-primary)",
              fontSize: 14,
              color: "var(--text-neutral-main)",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-10)",
              border: "1px solid var(--border-border-primary)",
              fontSize: 14,
              color: "var(--text-neutral-main)",
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "var(--text-state-error)" }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-10)",
              background: "var(--semantic-brand-500)",
              color: "var(--icon-neutral-white)",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-placeholder)",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--semantic-brand-500)", fontWeight: 500 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
