import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "../components/AuthGate";

export const metadata: Metadata = {
  title: "Ritnav Mailer",
  description: "Multi-user email campaign manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><AuthGate>{children}</AuthGate></body></html>;
}
