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
          "/api/gmail/status"
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
        "/api/gmail/disconnect",
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
      "/api/gmail/connect";

  }


  return (
    <div className="app_shell">

      <Sidebar />

      <div className="main_area">

        <header className="topbar">

          <div className="topbar_title">
            Gmail Settings
          </div>

        </header>


        <main className="page">

          <div className="page_header">

            <div>

              <h1 className="page_title">
                Gmail connection
              </h1>

              <p className="page_description">
                Connect the Gmail account that Ritmailer will use to send campaigns.
              </p>

            </div>

          </div>


          <div className="card">

            <div className="card_body">

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
                    className="btn btn_secondary"
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
                    className="btn btn_primary"
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

                Ritmailer requests permission to send
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

        <div className="brand_logo">
          R
        </div>

        <div>

          <div className="brand_name">
            Ritmailer
          </div>

          <div className="brand_subtitle">
            MAILER
          </div>

        </div>

      </div>


      <div className="nav_label">
        Workspace
      </div>


      <nav className="nav">

        <a
          href="/"
          className="nav_item"
        >
          <span className="nav_icon">
            Home
          </span>

          Dashboard
        </a>


        <a
          href="/upload"
          className="nav_item"
        >
          <span className="nav_icon">
            New
          </span>

          New Campaign
        </a>

      </nav>


      <div
        className="nav_label"
        style={{
          marginTop: 28,
        }}
      >
        Account
      </div>


      <nav className="nav">

        <a
          href="/settings/gmail"
          className="nav_item active"
        >
          <span className="nav_icon">
            G
          </span>

          Gmail
        </a>

      </nav>

    </aside>
  );
}