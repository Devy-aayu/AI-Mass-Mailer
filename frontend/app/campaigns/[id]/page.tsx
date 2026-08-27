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

  const leads = campaign?.leads || [];
  const sentLeads = useMemo(() => leads.filter((lead) => lead.status === "sent"), [leads]);
  const failedLeads = useMemo(() => leads.filter((lead) => lead.status === "failed"), [leads]);
  const successRate = campaign && campaign.total_recipients > 0 ? Math.round((campaign.sent_count / campaign.total_recipients) * 100) : 0;
  const sequence = buildReplaySequence(campaign);

  if (loading) return <Shell title="Campaign"><div className="page"><div className="card"><div className="card-body">Loading campaign…</div></div></div></Shell>;
  if (error || !campaign) return <Shell title="Campaign"><div className="page"><div className="auth-error">{error || "Campaign not found."}</div><Link href="/" className="btn btn-secondary">Back Back to overview</Link></div></Shell>;

  return <Shell title={campaign.name}>
    <main className="page">
      <div className="page-header">
        <div>
          <Link href="/" style={{ color: "var(--muted)", fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Back Overview</Link>
          <div className="eyebrow" style={{ marginTop: 18 }}>Campaign report</div>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="page-description">{campaign.subject || "Campaign messages"}</p>
        </div>
        <Status status={campaign.status} />
      </div>

      <div className="stats-grid">
        <Metric label="Recipients" value={campaign.total_recipients} />
        <Metric label="Sent" value={campaign.sent_count} />
        <Metric label="Failed" value={campaign.failed_count} />
        <Metric label="Success" value={successRate} suffix="%" />
      </div>

      <div className="replay-layout" style={{ marginBottom: 20 }}>
        <aside className="replay-rail">
          <div className="eyebrow">Campaign replay</div>
          <h3>What Ritmailer did.</h3>
          <p>Trace the campaign from import to the final recipient result without guessing what happened.</p>
          {sequence.map((item, index) => <div className="replay-step" key={item.title}>
            <div className="replay-line"><span className="replay-node" /></div>
            <div className="replay-copy"><strong>{index + 1}. {item.title}</strong><span>{item.detail}</span></div>
          </div>)}
        </aside>
        <section className="card">
          <div className="card-header"><h2 className="card-title">Execution timeline</h2><p className="card-description">The available timestamps are used to reconstruct the campaign sequence.</p></div>
          <div className="replay-feed">
            {sequence.map((item) => <div className="replay-event" key={item.key}>
              <div className="replay-time">{item.time}</div><div className="replay-marker" /><div><strong>{item.title}</strong><span>{item.detail}</span></div>
            </div>)}
          </div>
        </section>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2 className="card-title">Recipient intelligence</h2><p className="card-description">Ritmailer flags the campaign at a glance before you drill into individual messages.</p></div>
        <div className="card-body">
          <div className="intelligence-grid" style={{ marginBottom: 0 }}>
            <div>
              <div className="intel-title"><h3>Delivery health</h3><span>{successRate}% success</span></div>
              <div className="intel-meter"><span style={{ width: `${successRate}%` }} /></div>
              <div className="intel-list">
                <div className="intel-chip"><strong>{sentLeads.length}</strong><span>successful records</span></div>
                <div className="intel-chip"><strong>{failedLeads.length}</strong><span>failed records</span></div>
              </div>
            </div>
            <div>
              <div className="intel-title"><h3>Action</h3><span>Suggested next step</span></div>
              <div style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 8, background: failedLeads.length ? "var(--warn)" : "var(--mint)" }}>
                <strong style={{ fontSize: 13 }}>{failedLeads.length ? "Inspect failed recipients" : "Campaign is clean"}</strong>
                <div style={{ marginTop: 6, color: failedLeads.length ? "var(--warn-ink)" : "var(--mint-ink)", fontSize: 11, lineHeight: 1.5 }}>{failedLeads.length ? "Select a failed recipient below to inspect the stored error and message context." : "No failed records are currently attached to this campaign."}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Recipients</h2><p className="card-description">Select a recipient to inspect the exact stored message, sender and timestamp.</p></div>
        <div className="card-body" style={{ padding: 0 }}>
          {leads.length === 0 ? <div style={{ padding: 24, color: "var(--muted)" }}>No leads are attached to this campaign.</div> :
            <div className="table-wrap"><table><thead><tr>{["Recipient", "Company", "Status", "Sent at"].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} onClick={() => setSelected(lead)} style={{ cursor: "pointer" }}><td><div style={{ fontWeight: 800 }}>{lead.name || lead.email}</div><div style={{ color: "var(--muted)", fontSize: 10, marginTop: 3 }}>{lead.email}</div></td><td>{lead.company || "—"}</td><td><Status status={lead.status} /></td><td style={{ color: "var(--muted)" }}>{lead.sent_at ? formatDate(lead.sent_at) : "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </div>

      {selected && <div className="card" style={{ marginTop: 18 }}><div className="card-header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}><div><h2 className="card-title">Message for {selected.name || selected.email}</h2><p className="card-description">{selected.sent_at ? formatDate(selected.sent_at) : "Not sent"} · {selected.sent_from || "Sender unavailable"}</p></div><button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button></div><div className="card-body"><div style={{ marginBottom: 14 }}><div className="field-label">Subject</div><div style={{ fontWeight: 800 }}>{selected.sent_subject || campaign.subject || "—"}</div></div><div><div className="field-label">Message</div><div style={{ marginTop: 8, padding: 16, border: "1px solid var(--line)", borderRadius: 8, background: "#fbf7ef", whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: 13 }}>{selected.sent_body || "No stored message. This recipient may not have been sent successfully."}</div></div>{selected.error && <div className="auth-error" style={{ marginTop: 14 }}>Delivery error: {selected.error}</div>}{selected.message_id && <div style={{ marginTop: 12, fontSize: 10, color: "var(--muted)" }}>Provider message ID: {selected.message_id}</div>}</div></div>}
    </main>
  </Shell>;
}

function buildReplaySequence(campaign: (Campaign & { leads: CampaignLead[] }) | null) {
  if (!campaign) return [];
  const firstSent = campaign.leads.find((lead) => lead.sent_at)?.sent_at || null;
  const lastSent = campaign.leads.reduce<number | null>((latest, lead) => lead.sent_at && (!latest || lead.sent_at > latest) ? lead.sent_at : latest, null);
  return [
    { key: "created", title: "Campaign created", detail: `${campaign.total_recipients} recipient record${campaign.total_recipients === 1 ? "" : "s"} attached`, time: formatDate(campaign.created_at) },
    { key: "started", title: "Send process started", detail: campaign.started_at ? "The campaign entered its sending phase." : "No send-start timestamp was stored.", time: formatDate(campaign.started_at) },
    { key: "first", title: "First recipient processed", detail: firstSent ? "The first successful message timestamp is available." : "No successful send timestamp is available.", time: formatDate(firstSent) },
    { key: "last", title: "Final recipient result", detail: `${campaign.sent_count} sent · ${campaign.failed_count} failed`, time: formatDate(campaign.completed_at || lastSent) },
  ];
}
function formatDate(value?: number | null) { return value ? new Date(value * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function Status({ status }: { status: string }) { const good = status === "sent" || status === "completed"; const bad = status === "failed"; return <span className={`status-pill ${good ? "good" : bad ? "bad" : "warn"}`}><span className="status-dot" style={{ background: "currentColor", marginRight: 0 }} />{status.replace(/_/g, " ")}</span>; }
function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) { return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}{suffix}</div></div>; }
function Shell({ title, children }: { title: string; children: ReactNode }) { return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-logo">R</div><div><div className="brand-name">Ritmailer</div><div className="brand-subtitle">CAMPAIGN CONTROL</div></div></div><div className="nav-label">Workspace</div><nav className="nav"><Link href="/" className="nav-item"><span className="nav-icon">Home</span><span>Overview</span></Link><Link href="/upload" className="nav-item"><span className="nav-icon">New</span><span>New campaign</span></Link></nav><div className="nav-label" style={{ marginTop: 28 }}>Account</div><nav className="nav"><Link className="nav-item" href="/settings"><span className="nav-icon">Settings</span><span>Settings</span></Link></nav></aside><div className="main-area"><header className="topbar"><div className="topbar-title">{title}</div></header>{children}</div></div>; }
