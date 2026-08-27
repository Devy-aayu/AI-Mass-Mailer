"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signup } from "../../lib/api";

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
      await signup(name.trim(), email.trim(), password);
      
      await getCurrentUser();
      sessionStorage.setItem("ritmailer_onboarding", "1");
      router.replace("/settings/accounts?onboarding=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <div>
          <div className="auth-brand">RITMAILER</div>
          <h2>Turn a lead list into a campaign with a point of view.</h2>
          <p>Connect your sender, import your data, personalize your message and see exactly what happened after you pressed send.</p>
        </div>
        <span className="auth-stamp">Import · personalize · send · replay</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-panel">
          <div className="eyebrow">Start a workspace</div>
          <h1>Create your account</h1>
          <p>Use your own sending accounts and optional AI provider. Your campaign data stays tied to your account.</p>
          <form onSubmit={submit}>
            <div className="field"><label className="field-label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></div>
            <div className="field"><label className="field-label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
            <div className="field"><label className="field-label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required placeholder="8+ chars, letter and number" /></div>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Creating workspace…" : "Create account"}</button>
            <p className="auth-footer">Already have an account? <Link href="/login">Sign in</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
}
