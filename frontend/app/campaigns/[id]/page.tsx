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

  if (loading) return <Shell title="Campaign"><div className="page"><div className="card"><div className="card_body">Loading campaign…</div></div></div></Shell>;
  if (error || !campaign) return <Shell title="Campaign"><div className="page"><div className="auth_error">{error || "Campaign not found."}</div><Link href="/" className="btn btn_secondary">Back Back to overview</Link></div></Shell>;

  return <Shell title={campaign.name}>
    <main className="page">
      <div className="page_header">
        <div>
          <Link href="/" style={{ color: "var(--muted)", fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>Back Overview</Link>
          <div className="eyebrow" style={{ marginTop: 18 }}>Campaign report</div>
          <h1 className="page_title">{campaign.name}</h1>
          <p className="page_description">{campaign.subject || "Campaign messages"}</p>
        </div>
        <Status status={campaign.status} />
      </div>

      <div className="stats_grid">
        <Metric label="Recipients" value={campaign.total_recipients} />
        <Metric label="Sent" value={campaign.sent_count} />
        <Metric label="Failed" value={campaign.failed_count} />
        <Metric label="Success" value={successRate} suffix="%" />
      </div>

      <div className="replay_layout" style={{ marginBottom: 20 }}>
        <aside className="replay_rail">
          <div className="eyebrow">Campaign replay</div>
          <h3>What Ritmailer did.</h3>
          <p>Trace the campaign from import to the final recipient result without guessing what happened.</p>
          {sequence.map((item, index) => <div className="replay_step" key={item.title}>
            <div className="replay_line"><span className="replay_node" /></div>
            <div className="replay_copy"><strong>{index + 1}. {item.title}</strong><span>{item.detail}</span></div>
          </div>)}
        </aside>
        <section className="card">
          <div className="card_header"><h2 className="card_title">Execution timeline</h2><p className="card_description">The available timestamps are used to reconstruct the campaign sequence.</p></div>
          <div className="replay_feed">
            {sequence.map((item) => <div className="replay_event" key={item.key}>
              <div className="replay_time">{item.time}</div><div className="replay_marker" /><div><strong>{item.title}</strong><span>{item.detail}</span></div>
            </div>)}
          </div>
        </section>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card_header"><h2 className="card_title">Recipient intelligence</h2><p className="card_description">Ritmailer flags the campaign at a glance before you drill into individual messages.</p></div>
        <div className="card_body">
          <div className="intelligence_grid" style={{ marginBottom: 0 }}>
            <div>
              <div className="intel_title"><h3>Delivery health</h3><span>{successRate}% success</span></div>
              <div className="intel_meter"><span style={{ width: `${successRate}%` }} /></div>
              <div className="intel_list">
                <div className="intel_chip"><strong>{sentLeads.length}</strong><span>successful records</span></div>
                <div className="intel_chip"><strong>{failedLeads.length}</strong><span>failed records</span></div>
              </div>
            </div>
            <div>
              <div className="intel_title"><h3>Action</h3><span>Suggested next step</span></div>
              <div style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 8, background: failedLeads.length ? "var(--warn)" : "var(--mint)" }}>
                <strong style={{ fontSize: 13 }}>{failedLeads.length ? "Inspect failed recipients" : "Campaign is clean"}</strong>
                <div style={{ marginTop: 6, color: failedLeads.length ? "var(--warn-ink)" : "var(--mint-ink)", fontSize: 11, lineHeight: 1.5 }}>{failedLeads.length ? "Select a failed recipient below to inspect the stored error and message context." : "No failed records are currently attached to this campaign."}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card_header"><h2 className="card_title">Recipients</h2><p className="card_description">Select a recipient to inspect the exact stored message, sender and timestamp.</p></div>
        <div className="card_body" style={{ padding: 0 }}>
          {leads.length === 0 ? <div style={{ padding: 24, color: "var(--muted)" }}>No leads are attached to this campaign.</div> :
            <div className="table_wrap"><table><thead><tr>{["Recipient", "Company", "Status", "Sent at"].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} onClick={() => setSelected(lead)} style={{ cursor: "pointer" }}><td><div style={{ fontWeight: 800 }}>{lead.name || lead.email}</div><div style={{ color: "var(--muted)", fontSize: 10, marginTop: 3 }}>{lead.email}</div></td><td>{lead.company || "—"}</td><td><Status status={lead.status} /></td><td style={{ color: "var(--muted)" }}>{lead.sent_at ? formatDate(lead.sent_at) : "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </div>

      {selected && <div className="card" style={{ marginTop: 18 }}><div className="card_header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}><div><h2 className="card_title">Message for {selected.name || selected.email}</h2><p className="card_description">{selected.sent_at ? formatDate(selected.sent_at) : "Not sent"} · {selected.sent_from || "Sender unavailable"}</p></div><button className="btn btn_secondary" onClick={() => setSelected(null)}>Close</button></div><div className="card_body"><div style={{ marginBottom: 14 }}><div className="field_label">Subject</div><div style={{ fontWeight: 800 }}>{selected.sent_subject || campaign.subject || "—"}</div></div><div><div className="field_label">Message</div><div style={{ marginTop: 8, padding: 16, border: "1px solid var(--line)", borderRadius: 8, background: "#fbf7ef", whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: 13 }}>{selected.sent_body || "No stored message. This recipient may not have been sent successfully."}</div></div>{selected.error && <div className="auth_error" style={{ marginTop: 14 }}>Delivery error: {selected.error}</div>}{selected.message_id && <div style={{ marginTop: 12, fontSize: 10, color: "var(--muted)" }}>Provider message ID: {selected.message_id}</div>}</div></div>}
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
function Status({ status }: { status: string }) { const good = status === "sent" || status === "completed"; const bad = status === "failed"; return <span className={`status_pill ${good ? "good" : bad ? "bad" : "warn"}`}><span className="status_dot" style={{ background: "currentColor", marginRight: 0 }} />{status.replace(/_/g, " ")}</span>; }
function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) { return <div className="stat_card"><div className="stat_label">{label}</div><div className="stat_value">{value}{suffix}</div></div>; }
function Shell({ title, children }: { title: string; children: ReactNode }) { return <div className="app_shell"><aside className="sidebar"><div className="brand"><div className="brand_logo">R</div><div><div className="brand_name">Ritmailer</div><div className="brand_subtitle">CAMPAIGN CONTROL</div></div></div><div className="nav_label">Workspace</div><nav className="nav"><Link href="/" className="nav_item"><span className="nav_icon">Home</span><span>Overview</span></Link><Link href="/upload" className="nav_item"><span className="nav_icon">New</span><span>New campaign</span></Link>

        <a
          href="/automations"
          className="nav_item"
        >
          <span className="nav_icon">Soon</span>
          <span>Automations</span>
        </a>

      </nav><div className="nav_label" style={{ marginTop: 28 }}>Account</div><nav className="nav"><Link className="nav_item" href="/settings"><span className="nav_icon">Settings</span><span>Settings</span></Link></nav></aside><div className="main_area"><header className="topbar"><div className="topbar_title">{title}</div></header>{children}</div></div>; }
