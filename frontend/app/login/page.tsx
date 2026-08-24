"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, login } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      const me = await getCurrentUser();
      router.replace(me.user ? next : "/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <div>
          <div className="auth-brand">RITMAILER</div>
          <h2>Every send should have a reason.</h2>
          <p>Ritmailer keeps lead import, personalization, delivery and campaign history in one deliberate workspace.</p>
        </div>
        <span className="auth-stamp">Campaign control · built for real sends</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-panel">
          <div className="eyebrow">Welcome back</div>
          <h1>Sign in</h1>
          <p>Open your campaign workspace and continue where you left off.</p>
          <form onSubmit={submit}>
            <div className="field"><label className="field-label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
            <div className="field"><label className="field-label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
            <p className="auth-footer">New here? <Link href="/signup">Create an account</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
}
