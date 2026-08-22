"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { Campaign, CampaignLead, getCampaign } from "../../../lib/api";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<(Campaign & { leads: CampaignLead[] }) | null>(null);
  const [selected, setSelected] = useState<CampaignLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    getCampaign(params.id)
      .then((data) => setCampaign(data.campaign))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load campaign."))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const sentLeads = useMemo(() => (campaign?.leads || []).filter((lead) => lead.status === "sent"), [campaign]);

  if (loading) return <Shell title="Campaign"> <div className="page"><div className="card"><div className="card-body">Loading campaign…</div></div></div></Shell>;
  if (error || !campaign) return <Shell title="Campaign"><div className="page"><div className="auth-error">{error || "Campaign not found."}</div><Link href="/" className="btn btn-secondary">← Back to Dashboard</Link></div></Shell>;

  return <Shell title={campaign.name}>
    <main className="page">
      <div className="page-header">
        <div>
          <Link href="/" style={{ color: "#777", fontSize: 12, textDecoration: "none" }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>{campaign.name}</h1>
          <p className="page-description">{campaign.subject || "Campaign messages"}</p>
        </div>
        <Status status={campaign.status} />
      </div>

      <div className="stats-grid">
        <Metric label="Recipients" value={campaign.total_recipients} />
        <Metric label="Sent" value={campaign.sent_count} />
        <Metric label="Failed" value={campaign.failed_count} />
        <Metric label="Sent records" value={sentLeads.length} />
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Recipients</h2><p className="card-description">Click a recipient to see the exact email sent, sender and timestamp.</p></div>
        <div className="card-body" style={{ padding: 0 }}>
          {campaign.leads.length === 0 ? <div style={{ padding: 24, color: "#777" }}>No leads are attached to this campaign.</div> :
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>{["Recipient", "Company", "Status", "Sent at"].map((x) => <th key={x} style={{ padding: "14px 18px", fontSize: 12, color: "#777" }}>{x}</th>)}</tr></thead><tbody>{campaign.leads.map((lead) => <tr key={lead.id} onClick={() => setSelected(lead)} style={{ borderBottom: "1px solid #f1f1f1", cursor: "pointer" }}><td style={{ padding: "15px 18px" }}><div style={{ fontWeight: 700 }}>{lead.name || lead.email}</div><div style={{ color: "#888", fontSize: 12 }}>{lead.email}</div></td><td style={{ padding: "15px 18px", fontSize: 13 }}>{lead.company || "—"}</td><td style={{ padding: "15px 18px" }}><Status status={lead.status} /></td><td style={{ padding: "15px 18px", color: "#777", fontSize: 12 }}>{lead.sent_at ? formatDate(lead.sent_at) : "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </div>

      {selected && <div className="card" style={{ marginTop: 18 }}><div className="card-header" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><div><h2 className="card-title">Message sent to {selected.name || selected.email}</h2><p className="card-description">{selected.sent_at ? formatDate(selected.sent_at) : "Not sent"} · {selected.sent_from || "Sender unavailable"}</p></div><button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button></div><div className="card-body"><div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>Subject</div><div style={{ fontWeight: 700, marginTop: 4 }}>{selected.sent_subject || campaign.subject || "—"}</div></div><div><div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>Message</div><div style={{ marginTop: 8, padding: 16, border: "1px solid #eee", borderRadius: 10, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selected.sent_body || "No stored message. This recipient may not have been sent successfully."}</div></div>{selected.message_id && <div style={{ marginTop: 12, fontSize: 11, color: "#888" }}>Provider message ID: {selected.message_id}</div>}</div></div>}
    </main>
  </Shell>;
}

function formatDate(value: number) { return new Date(value * 1000).toLocaleString(); }
function Status({ status }: { status: string }) { return <span style={{ textTransform: "capitalize", fontSize: 12, padding: "5px 9px", borderRadius: 999, background: status === "sent" || status === "completed" ? "#edf8ef" : status === "failed" ? "#fff1f1" : "#f5f5f5" }}>{status.replace(/_/g, " ")}</span>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>; }
function Shell({ title, children }: { title: string; children: ReactNode }) { return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-logo">R</div><div><div className="brand-name">Ritnav</div><div className="brand-subtitle">MAILER</div></div></div><div className="nav-label">Workspace</div><nav className="nav"><Link href="/" className="nav-item"><span className="nav-icon">⌂</span><span>Dashboard</span></Link><Link href="/upload" className="nav-item"><span className="nav-icon">↑</span><span>New Campaign</span></Link></nav><div className="nav-label" style={{ marginTop: 28 }}>Account</div><nav className="nav"><Link className="nav-item" href="/settings"><span className="nav-icon">⚙</span><span>Settings</span></Link></nav></aside><div className="main-area"><header className="topbar"><div className="topbar-title">{title}</div></header>{children}</div></div>; }
