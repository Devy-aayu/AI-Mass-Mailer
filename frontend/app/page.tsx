"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Campaign, listCampaigns } from "../lib/api";

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listCampaigns()
      .then((data) => setCampaigns(data.campaigns || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load campaigns."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => campaigns.reduce((acc, campaign) => {
    acc.recipients += Number(campaign.total_recipients || 0);
    acc.sent += Number(campaign.sent_count || 0);
    acc.failed += Number(campaign.failed_count || 0);
    return acc;
  }, { recipients: 0, sent: 0, failed: 0 }), [campaigns]);

  const successRate = stats.sent + stats.failed > 0
    ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
    : 100;

  const attention = campaigns.filter((campaign) => campaign.failed_count > 0).length;
  const latest = [...campaigns].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0];

  return (
    <div className="app_shell">
      <Sidebar active="dashboard" />
      <div className="main_area">
        <Topbar title="Workspace" />
        <main className="page">
          <section className="dashboard_hero">
            <div>
              <div className="eyebrow">Ritmailer</div>
              <h2>Send mails in one click. Make every message personal.</h2>
              <p>Import a lead list, personalize it, and keep a precise record of what happened to every recipient.</p>
            </div>
            <div className="hero_note">
              <strong>{successRate}%</strong>
              <span>success rate</span>
            </div>
          </section>

          <div className="page_header">
            <div>
              <div className="eyebrow">Your workshop</div>
              <h1 className="page_title">Campaigns</h1>
              <p className="page_description">A single view of recipients, delivery and campaign health.</p>
            </div>
            <Link href="/upload" className="btn btn_primary">+ New campaign</Link>
          </div>

          <div className="stats_grid">
            <Stat label="Recipients" value={String(stats.recipients)} change={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`} />
            <Stat label="Sent" value={String(stats.sent)} change="Recorded by Ritmailer" />
            <Stat label="Failed" value={String(stats.failed)} change={stats.failed ? "Needs attention" : "No failures"} />
            <Stat label="Success" value={`${successRate}%`} change="Sent / total attempts" />
          </div>

          <div className="intelligence_grid">
            <section className="card intel_panel">
              <div className="intel_title"><h3>Campaign intelligence</h3><span>Live from your workshop</span></div>
              <div className="intel_meter"><span style={{ width: `${successRate}%` }} /></div>
              <div className="intel_list">
                <div className="intel_chip"><strong>{latest ? formatDate(latest.created_at) : "—"}</strong><span>latest campaign</span></div>
                <div className="intel_chip"><strong>{attention}</strong><span>campaigns with failures</span></div>
              </div>
            </section>
            <section className="card intel_panel">
              <div className="intel_title"><h3>Ready state</h3><span>Pre-flight</span></div>
              <div style={{ fontSize: 13, fontWeight: 750, marginBottom: 6 }}><span className={`status_dot ${attention ? "" : "good"}`} />{attention ? "Review failed recipients" : "Workspace looks clean"}</div>
              <div style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.5 }}>{attention ? "Open an affected campaign and use the replay view to inspect exactly what happened." : "Create a campaign whenever you are ready to import a new list."}</div>
            </section>
          </div>

          {error && <div className="auth_error">{error}</div>}

          <div className="card">
            <div className="card_header">
              <h2 className="card_title">Campaign log</h2>
              <p className="card_description">Open a campaign to inspect each recipient and replay the send sequence.</p>
            </div>
            <div className="card_body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 24, color: "var(--muted)" }}>Loading campaigns…</div>
              ) : campaigns.length === 0 ? (
                <div style={{ padding: 30 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Your first campaign starts here.</div>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Upload an Excel or CSV lead list to begin.</div>
                  <Link href="/upload" className="btn btn_primary">Create campaign</Link>
                </div>
              ) : (
                <div className="table_wrap">
                  <table>
                    <thead><tr>{["Campaign", "Recipients", "Sent", "Failed", "State", "Created"].map((title) => <th key={title}>{title}</th>)}</tr></thead>
                    <tbody>{campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td><Link href={`/campaigns/${encodeURIComponent(campaign.id)}`} style={{ fontWeight: 800 }}>{campaign.name}</Link><div style={{ color: "var(--muted)", fontSize: 10, marginTop: 3 }}>{campaign.subject || "No subject"}</div></td>
                        <td>{campaign.total_recipients}</td>
                        <td>{campaign.sent_count}</td>
                        <td>{campaign.failed_count}</td>
                        <td><Status status={campaign.status} /></td>
                        <td style={{ color: "var(--muted)" }}>{formatDate(campaign.created_at)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatDate(value?: number | null) {
  if (!value) return "—";
  return new Date(value * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function Status({ status }: { status: string }) {
  const good = status === "completed" || status === "sent";
  const bad = status === "failed";
  return <span className={`status_pill ${good ? "good" : bad ? "bad" : "warn"}`}><span className="status_dot" style={{ background: "currentColor", marginRight: 0 }} />{status.replace(/_/g, " ")}</span>;
}
function Stat({ label, value, change }: { label: string; value: string; change: string }) {
  return <div className="stat_card"><div className="stat_label">{label}</div><div className="stat_value">{value}</div><div className="stat_change">{change}</div></div>;
}
function Sidebar({ active }: { active: string }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand_logo">R</div><div><div className="brand_name">Ritmailer</div><div className="brand_subtitle">CAMPAIGN CONTROL</div></div></div>
    <div className="nav_label">Workspace</div>
    <nav className="nav">
      <Link href="/" className={`nav_item ${active === "dashboard" ? "active" : ""}`}><span className="nav_icon">Home</span><span>Overview</span></Link>
      <Link href="/upload" className="nav_item"><span className="nav_icon">New</span><span>New campaign</span></Link>
    </nav>
    <div className="nav_label" style={{ marginTop: 28 }}>Account</div>
    <nav className="nav"><Link className="nav_item" href="/settings"><span className="nav_icon">Settings</span><span>Settings</span></Link></nav>
  </aside>;
}
function Topbar({ title }: { title: string }) { return <header className="topbar"><div className="topbar_title">{title}</div></header>; }
