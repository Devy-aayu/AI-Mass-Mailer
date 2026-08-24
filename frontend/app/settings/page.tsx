import Link from "next/link";

export default function SettingsPage() {
  return <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
    <h1 style={{ fontSize: 28, marginBottom: 8 }}>Settings</h1>
    <p style={{ color: "#777", marginBottom: 28 }}>Manage sending accounts and your optional AI provider.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
      <SettingLink href="/settings/accounts" title="Email Accounts" text="Connect Gmail, Outlook, Zoho or custom SMTP mailboxes." />
      <SettingLink href="/settings/ai" title="AI Configuration" text="Use your own OpenRouter or OpenAI-compatible API key and model." />
    </div>
  </main>;
}

function SettingLink({ href, title, text }: { href: string; title: string; text: string }) {
  return <Link href={href} style={{ display: "block", padding: 22, border: "1px solid #e5e5e5", borderRadius: 14, textDecoration: "none", color: "inherit", background: "#fff" }}><h2 style={{ margin: "0 0 8px", fontSize: 17 }}>{title}</h2><p style={{ margin: 0, color: "#777", fontSize: 13, lineHeight: 1.5 }}>{text}</p></Link>;
}
