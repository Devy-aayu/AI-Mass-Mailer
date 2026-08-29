"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, login } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("next");
    if (value && value.startsWith("/")) setNextPath(value);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      const me = await getCurrentUser();
      router.replace(me.user ? nextPath : "/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth_page">
      <section className="auth_aside">
        <div>
          <div className="auth_brand">RITMAILER</div>
          <h2>Fix clients in one click.</h2>
          <p>Send personalized emails at scale.</p>
        </div>
        <span className="auth_stamp">Campaign control · built to lead</span>
      </section>
      <section className="auth_form_side">
        <div className="auth_panel">
          <div className="eyebrow">Welcome Home</div>
          <h1>Sign in</h1>
          <p>Open your workshop and continue where you left off.</p>
          <form onSubmit={submit}>
            <div className="field"><label className="field_label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
            <div className="field"><label className="field_label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
            {error && <div className="auth_error">{error}</div>}
            <button className="btn btn_primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
            <p className="auth_footer">New here? <Link href="/signup">Create an account</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
}
