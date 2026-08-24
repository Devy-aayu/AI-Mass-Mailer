"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      router.replace("/settings/accounts?onboarding=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 style={{ margin: "10px 0 6px", fontSize: 28 }}>
            Create your account
          </h1>
          <p style={{ margin: 0, color: "#777", fontSize: 13 }}>
            Connect your own sending accounts and optional AI provider.
          </p>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label className="field-label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
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
              minLength={8}
              required
              placeholder="8+ chars, letter and number"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
          <p className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
