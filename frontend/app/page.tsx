"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listCampaigns, Campaign } from "../lib/api";

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

  const stats = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.recipients += Number(campaign.total_recipients || 0);
        acc.sent += Number(campaign.sent_count || 0);
        acc.failed += Number(campaign.failed_count || 0);
        return acc;
      },
      { recipients: 0, sent: 0, failed: 0 }
    );
  }, [campaigns]);

  return (
    <div className="app-shell">
      <Sidebar active="dashboard" />
      <div className="main-area">
        <Topbar title="Dashboard" />
        <main className="page">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">Track every campaign, recipient and message you have sent.</p>
            </div>
            <Link href="/upload" className="btn btn-primary">+ New Campaign</Link>
          </div>

          <div className="stats-grid">
            <Stat label="Total Recipients" value={String(stats.recipients)} change={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`} />
            <Stat label="Emails Sent" value={String(stats.sent)} change="Successfully sent" />
            <Stat label="Successful" value={String(stats.sent)} change="Delivered by sender" />
            <Stat label="Failed" value={String(stats.failed)} change={stats.failed ? "Needs attention" : "No failures"} />
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 18 }}>{error}</div>}

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Campaigns</h2>
              <p className="card-description">Open a campaign to see every recipient and the exact message sent to each person.</p>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 24, color: "#777" }}>Loading campaigns…</div>
              ) : campaigns.length === 0 ? (
                <div style={{ padding: 30 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>No campaigns yet</div>
                  <div style={{ color: "#777", fontSize: 13, marginBottom: 16 }}>Upload your Excel/CSV leads to create your first campaign.</div>
                  <Link href="/upload" className="btn btn-primary">Create Campaign</Link>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                        {[
                          "Campaign", "Recipients", "Sent", "Failed", "Status", "Created"
                        ].map((title) => <th key={title} style={{ padding: "14px 18px", fontSize: 12, color: "#777", fontWeight: 650 }}>{title}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                          <td style={{ padding: "16px 18px" }}>
                            <Link href={`/campaigns/${encodeURIComponent(campaign.id)}`} style={{ color: "#111", textDecoration: "none", fontWeight: 700 }}>
                              {campaign.name}
                            </Link>
                            <div style={{ color: "#888", fontSize: 11, marginTop: 3 }}>{campaign.id}</div>
                          </td>
                          <td style={{ padding: "16px 18px", fontSize: 13 }}>{campaign.total_recipients}</td>
                          <td style={{ padding: "16px 18px", fontSize: 13 }}>{campaign.sent_count}</td>
                          <td style={{ padding: "16px 18px", fontSize: 13 }}>{campaign.failed_count}</td>
                          <td style={{ padding: "16px 18px" }}><Status status={campaign.status} /></td>
                          <td style={{ padding: "16px 18px", fontSize: 12, color: "#777" }}>{formatDate(campaign.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
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
  return new Date(value * 1000).toLocaleString();
}

function Status({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <span style={{ textTransform: "capitalize", fontSize: 12, padding: "5px 9px", borderRadius: 999, background: status === "completed" ? "#edf8ef" : status === "failed" ? "#fff1f1" : "#f5f5f5" }}>{label}</span>;
}

function Stat({ label, value, change }: { label: string; value: string; change: string }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-change">{change}</div></div>;
}

function Sidebar({ active }: { active: string }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-logo">R</div><div><div className="brand-name">Ritnav</div><div className="brand-subtitle">MAILER</div></div></div>
    <div className="nav-label">Workspace</div>
    <nav className="nav">
      <Link href="/" className={`nav-item ${active === "dashboard" ? "active" : ""}`}><span className="nav-icon">⌂</span><span>Dashboard</span></Link>
      <Link href="/upload" className="nav-item"><span className="nav-icon">↑</span><span>New Campaign</span></Link>
    </nav>
    <div className="nav-label" style={{ marginTop: 28 }}>Account</div>
    <nav className="nav"><Link className="nav-item" href="/settings"><span className="nav-icon">⚙</span><span>Settings</span></Link></nav>
  </aside>;
}

function Topbar({ title }: { title: string }) {
  return <header className="topbar"><div className="topbar-title">{title}</div></header>;
}
