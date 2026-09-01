"use client";

import Link from "next/link";

export default function AutomationsPage() {
  return (
    <div className="app_shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <div className="brand_logo">R</div>
          <div>
            <div className="brand_name">Ritmailer</div>
            <div className="brand_subtitle">MAILER</div>
          </div>
        </Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/" className="nav_item"><span>Dashboard</span></Link>
          <Link href="/settings" className="nav_item"><span>Settings</span></Link>
          <Link href="/automations" className="nav_item active"><span>Automations</span></Link>
        </nav>
        <nav className="nav nav_actions" aria-label="Campaign actions">
          <Link href="/upload" className="nav_item"><span>+ New</span></Link>
        </nav>
      </aside>
      <div className="main_area">
        <main className="page">
          <div className="coming_soon">
            <div className="eyebrow">Automations</div>
            <h1 className="page_title">Build once. Let it run.</h1>
            <p className="page_description">
              Automated campaign workflows are being built now. This area will handle scheduled sends, follow-ups and repeatable campaign routines.
            </p>
            <div className="coming_soon_mark">SOON</div>
            <div>
              <Link href="/" className="btn btn_secondary">Back to Dashboard</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
