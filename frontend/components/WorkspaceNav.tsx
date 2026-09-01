import Link from "next/link";

type WorkspaceNavProps = {
  active?: "dashboard" | "settings" | "automations";
};

export default function WorkspaceNav({ active }: WorkspaceNavProps) {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="Ritmailer home">
        <div className="brand_logo">R</div>
        <div>
          <div className="brand_name">Ritmailer</div>
          <div className="brand_subtitle">MAILER</div>
        </div>
      </Link>

      <nav className="nav" aria-label="Main navigation">
        <Link href="/" className={`nav_item ${active === "dashboard" ? "active" : ""}`}>
          <span>Dashboard</span>
        </Link>
        <Link href="/settings" className={`nav_item ${active === "settings" ? "active" : ""}`}>
          <span>Settings</span>
        </Link>
        <Link href="/automations" className={`nav_item ${active === "automations" ? "active" : ""}`}>
          <span>Automations</span>
        </Link>
      </nav>

      <nav className="nav nav_actions" aria-label="Campaign actions">
        <Link href="/upload" className="nav_item">
          <span>+ New campaign</span>
        </Link>
      </nav>
    </aside>
  );
}
