"use client";

import { useEffect, useState } from "react";

type GmailStatus = {
  connected: boolean;
};

export default function GmailSettingsPage() {

  const [status, setStatus] =
    useState<GmailStatus>({
      connected: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [disconnecting, setDisconnecting] =
    useState(false);

  useEffect(() => {

    checkStatus();

  }, []);


  async function checkStatus() {

    try {

      const response =
        await fetch(
          "http://127.0.0.1:8000/api/gmail/status"
        );

      const data =
        await response.json();

      setStatus(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  }


  async function disconnect() {

    const confirmed =
      window.confirm(
        "Disconnect your Gmail account?"
      );

    if (!confirmed) return;

    setDisconnecting(true);

    try {

      await fetch(
        "http://127.0.0.1:8000/api/gmail/disconnect",
        {
          method: "POST",
        }
      );

      setStatus({
        connected: false,
      });

    } catch (error) {

      console.error(error);

    } finally {

      setDisconnecting(false);

    }
  }


  function connect() {

    window.location.href =
      "http://127.0.0.1:8000/api/gmail/connect";

  }


  return (
    <div className="app-shell">

      <Sidebar />

      <div className="main-area">

        <header className="topbar">

          <div className="topbar-title">
            Gmail Settings
          </div>

        </header>


        <main className="page">

          <div className="page-header">

            <div>

              <h1 className="page-title">
                Gmail connection
              </h1>

              <p className="page-description">
                Connect the Gmail account that Ritnav Mailer will use to send campaigns.
              </p>

            </div>

          </div>


          <div className="card">

            <div className="card-body">

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >

                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  G
                </div>


                <div style={{ flex: 1 }}>

                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    Gmail
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    {loading
                      ? "Checking connection..."
                      : status.connected
                        ? "Your Gmail account is connected."
                        : "No Gmail account is connected."}
                  </div>

                </div>


                {!loading && status.connected && (

                  <button
                    className="btn btn-secondary"
                    onClick={disconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </button>

                )}


                {!loading && !status.connected && (

                  <button
                    className="btn btn-primary"
                    onClick={connect}
                  >
                    Connect Gmail
                  </button>

                )}

              </div>


              <div
                style={{
                  marginTop: 28,
                  padding: 16,
                  borderRadius: 10,
                  background: "#fafafa",
                  border: "1px solid #eee",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "#666",
                }}
              >

                <strong
                  style={{
                    color: "#333",
                  }}
                >
                  Permission requested
                </strong>

                <br />

                Ritnav Mailer requests permission to send
                email through the Gmail account you explicitly
                connect. It does not ask for your Gmail password.

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


function Sidebar() {

  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-logo">
          R
        </div>

        <div>

          <div className="brand-name">
            Ritnav
          </div>

          <div className="brand-subtitle">
            MAILER
          </div>

        </div>

      </div>


      <div className="nav-label">
        Workspace
      </div>


      <nav className="nav">

        <a
          href="/"
          className="nav-item"
        >
          <span className="nav-icon">
            ⌂
          </span>

          Dashboard
        </a>


        <a
          href="/upload"
          className="nav-item"
        >
          <span className="nav-icon">
            ↑
          </span>

          New Campaign
        </a>

      </nav>


      <div
        className="nav-label"
        style={{
          marginTop: 28,
        }}
      >
        Account
      </div>


      <nav className="nav">

        <a
          href="/settings/gmail"
          className="nav-item active"
        >
          <span className="nav-icon">
            G
          </span>

          Gmail
        </a>

      </nav>

    </aside>
  );
}