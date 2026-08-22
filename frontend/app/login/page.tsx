"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, login } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const me = await getCurrentUser();
      router.replace(me.user ? "/" : "/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your email campaigns."
    >
      <form onSubmit={submit}>
        <div className="field">
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="auth-footer">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f7f7f7",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid #e7e7e7",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1.8,
              fontWeight: 800,
            }}
          >
            RITNAV MAILER
          </div>
          <h1 style={{ margin: "10px 0 6px", fontSize: 28 }}>{title}</h1>
          <p style={{ margin: 0, color: "#777", fontSize: 13 }}>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
