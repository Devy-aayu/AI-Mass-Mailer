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
      .then((data) => {
        setCampaigns(data.campaigns || []);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load campaigns."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.recipients += Number(campaign.total_recipients || 0);
        acc.sent += Number(campaign.sent_count || 0);
        acc.failed += Number(campaign.failed_count || 0);

        return acc;
      },
      {
        recipients: 0,
        sent: 0,
        failed: 0,
      }
    );
  }, [campaigns]);

  const successRate =
    stats.sent + stats.failed > 0
      ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
      : 100;

  const attention = campaigns.filter(
    (campaign) => campaign.failed_count > 0
  ).length;

  const latest = [...campaigns].sort(
    (a, b) => (b.created_at || 0) - (a.created_at || 0)
  )[0];

  return (
    <div className="app_shell">
      <TopNavigation />
      <main className="page">
        <section className="dashboard_hero">
        <div className="hero_brand">
          <span className="hero_logo">R</span>
          <span className="hero_name">
            Ritmailer
          </span>
        </div>
        <div className="hero_stats">
          <Stat
            label="Recipients"
            value={stats.recipients.toString()}
            change={`+${stats.recipients} this month`}
          />
          <Stat
            label="Sent"
            value={stats.sent.toString()}
            change={`+${stats.sent} this month`}
          />
          <Stat
            label="Failed"
            value={stats.failed.toString()}
            change={`+${stats.failed} this month`}
          />
          <Stat
            label="Success rate"
            value={`${successRate}%`}
            change={`${
              successRate >= 90 ? "Good" : "Needs improvement"
            }`}
          />

        <Link 
          href="/campaigns"
          className="btn btn_primary"
        >
          View all campaigns
        </Link>
        <Link 
          href="/upload"
          className="btn btn_secondary"
        >
          Create new campaign
        </Link>
        
        </div>
        </section>
      </main>
    </div>
  );
}

function TopNavigation() {
  return (
    <header className="topbar">
      <div className="topbar_inner">
        <Link
          href="/"
          className="topbar_brand"
        >
          <span className="topbar_logo">
            R
          </span>

          <span className="topbar_name">
            Ritmailer
          </span>
        </Link>

        <nav className="topbar_nav">
          <Link
            href="/"
            className="topbar_link active"
          >
            Overview
          </Link>

          <Link
            href="/upload"
            className="topbar_link"
          >
            New campaign
          </Link>

          <Link
            href="/automations"
            className="topbar_link"
          >
            Automations
          </Link>

          <Link
            href="/settings"
            className="topbar_link"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}

function formatDate(
  value?: number | null
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value * 1000
  ).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Status({
  status,
}: {
  status: string;
}) {
  const good =
    status === "completed" ||
    status === "sent";

  const bad =
    status === "failed";

  return (
    <span
      className={`status_pill ${
        good
          ? "good"
          : bad
          ? "bad"
          : "warn"
      }`}
    >
      <span
        className="status_dot"
        style={{
          background: "currentColor",
          marginRight: 0,
        }}
      />

      {status.replace(/_/g, " ")}
    </span>
  );
}

function Stat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="stat_card">
      <div className="stat_label">
        {label}
      </div>

      <div className="stat_value">
        {value}
      </div>

      <div className="stat_change">
        {change}
      </div>
    </div>
  );
}
