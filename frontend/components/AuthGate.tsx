"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "../lib/api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(pathname === "/login" || pathname === "/signup");

  useEffect(() => {
    if (pathname === "/login" || pathname === "/signup") {
      setReady(true);
      return;
    }
    let active = true;
    getCurrentUser()
      .then(() => { if (active) setReady(true); })
      .catch(() => { if (active) router.replace("/login"); });
    return () => { active = false; };
  }, [pathname, router]);

  if (!ready) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontSize: 13, color: "#777" }}>Checking session…</div>;
  }

  return <>{children}</>;
}
