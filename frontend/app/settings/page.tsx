import Link from "next/link";
import WorkspaceNav from "../../components/WorkspaceNav";

export default function SettingsPage() {
  return (
    <div className="app_shell">
      <WorkspaceNav active="settings" />
      <div className="main_area">
        <main className="page">
          <div className="page_header">
            <div>
              <div className="eyebrow">Workspace settings</div>
              <h1 className="page_title">Settings</h1>
              <p className="page_description">Keep the accounts and optional AI tools used by your campaigns in one place.</p>
            </div>
          </div>

          <div className="settings_grid">
            <Link href="/settings/accounts" className="settings_card">
              <span className="settings_number">01</span>
              <h2>Email accounts</h2>
              <p>Connect Gmail, Outlook, Zoho or a custom SMTP mailbox.</p>
              <span className="settings_arrow">Open →</span>
            </Link>
            <Link href="/settings/ai" className="settings_card">
              <span className="settings_number">02</span>
              <h2>AI configuration</h2>
              <p>Choose an OpenRouter or OpenAI-compatible provider for generation.</p>
              <span className="settings_arrow">Open →</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
