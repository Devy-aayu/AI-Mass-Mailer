"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, getCurrentUser } from "../lib/api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicRoute = pathname === "/login" || pathname === "/signup";
  const [state, setState] = useState<"checking" | "ready" | "unavailable">(publicRoute ? "ready" : "checking");
  const [error, setError] = useState("");

  useEffect(() => {
    if (publicRoute) {
      setState("ready");
      setError("");
      return;
    }

    let active = true;
    setState("checking");
    setError("");

    getCurrentUser()
      .then(() => {
        if (active) setState("ready");
      })
      .catch((errorValue) => {
        if (!active) return;

        if (errorValue instanceof ApiError && errorValue.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        setError(errorValue instanceof Error ? errorValue.message : "Could not verify your session.");
        setState("unavailable");
      });

    return () => { active = false; };
  }, [pathname, publicRoute, router]);

  if (state === "unavailable") {
    return (
      <main className="session_recovery">
        <div className="session_recovery_card">
          <div className="eyebrow">RITMAILER</div>
          <h1>We couldn&apos;t verify your session.</h1>
          <p>{error || "The service may be briefly unavailable. Your account has not been signed out."}</p>
          <div className="session_recovery_actions">
            <button className="btn btn_primary" onClick={() => window.location.reload()}>Try again</button>
            <button className="btn btn_secondary" onClick={() => router.replace("/login")}>Open sign in</button>
          </div>
        </div>
      </main>
    );
  }

  if (state === "checking") {
    return (
      <main className="session_check">
        <div className="session_mark">R</div>
        <div>Checking your workspace…</div>
      </main>
    );
  }

  return <>{children}</>;
}
