"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import FileUploader from "../../components/FileUploader";
import { getEmailAccounts, getConnectUrl, createCampaign, EmailAccount } from "../../lib/api";


type Lead = {
  name: string;
  email: string;
  phone: string;
  company: string;
};


type UploadResult = {
  success: boolean;
  filename: string;

  total_rows: number;

  usable_leads: number;
  email_leads: number;
  phone_leads: number;
  both_contact_methods: number;
  no_contact_rows: number;

  email_column: string | null;
  phone_column: string | null;
  name_column: string | null;
  company_column: string | null;

  email_confidence: number;
  phone_confidence: number;
  name_confidence: number;
  company_confidence: number;

  leads: Lead[];

  emails: string[];
};


export default function UploadPage() {

  const router = useRouter();

  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    getEmailAccounts()
      .then(async data => {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          const existing = sessionStorage.getItem("ritnavCampaignId");
          if (existing) {
            setCampaignId(existing);
          } else {
            const created = await createCampaign(`Campaign ${new Date().toLocaleString()}`, data.accounts[0].id);
            setCampaignId(created.campaign.id);
          }
        }
      })
      .catch(error => setAccountError(error instanceof Error ? error.message : "Could not verify sending accounts."))
      .finally(() => setAccountsLoading(false));
  }, []);

  const [result, setResult] =
    useState<UploadResult | null>(null);


  function handleUploaded(
    data: UploadResult
  ) {

    setResult(data);
    sessionStorage.setItem("ritnavCampaignId", campaignId);


    // Store ALL usable leads.
    //
    // This includes phone-only leads.
    // The email campaign will filter these later.
    sessionStorage.setItem(
      "ritnavLeads",
      JSON.stringify(data.leads)
    );


    // Store useful campaign statistics.
    sessionStorage.setItem(
      "ritnavLeadInfo",
      JSON.stringify({
        filename: data.filename,
        totalRows: data.total_rows,
        usableLeads: data.usable_leads,
        emailLeads: data.email_leads,
        phoneLeads: data.phone_leads,
      })
    );
  }


  function continueToCompose() {

    if (
      !result ||
      result.email_leads === 0
    ) {
      return;
    }

    router.push("/compose");
  }


  return (

    <div className="app-shell">

      <Sidebar />

      <div className="main-area">

        <Topbar title="New Campaign" />

        <main className="page">

          {!accountsLoading && accounts.length === 0 && !result && (
            <div className="card" style={{ maxWidth: 760, margin: "40px auto" }}>
              <div className="card-body">
                <h1 className="page-title" style={{ fontSize: 26 }}>Connect a sending account first</h1>
                <p className="page-description" style={{ marginBottom: 20 }}>
                  At least one Gmail, Outlook, Zoho, or SMTP mailbox must be connected before you can upload leads or create a campaign.
                </p>
                {accountError && <div className="auth-error">{accountError}</div>}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="btn btn-primary" href={getConnectUrl("gmail")} style={{ textDecoration: "none" }}>Connect Gmail</a>
                  <a className="btn btn-secondary" href={getConnectUrl("outlook")} style={{ textDecoration: "none" }}>Connect Outlook</a>
                  <a className="btn btn-secondary" href="/settings/accounts" style={{ textDecoration: "none" }}>Zoho / Custom SMTP</a>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* UPLOAD                                              */}
          {/* -------------------------------------------------- */}

          {!accountsLoading && accounts.length > 0 && !result && (

            <div className="upload-container">

              <div className="page-header">

                <div>

                  <h1 className="page-title">
                    Import leads
                  </h1>

                  <p className="page-description">
                    Upload the CSV or Excel file generated
                    by your lead generator.
                  </p>

                </div>

              </div>


              <div className="card upload-card">

                <FileUploader
                  campaignId={campaignId}
                  onUploaded={handleUploaded}
                />

              </div>

            </div>

          )}


          {/* -------------------------------------------------- */}
          {/* RESULT                                              */}
          {/* -------------------------------------------------- */}

          {result && (

            <div>

              <div className="page-header">

                <div>

                  <h1 className="page-title">
                    Leads imported
                  </h1>

                  <p className="page-description">
                    Your file has been analyzed and the
                    available contact methods were detected.
                  </p>

                </div>


                <div
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >

                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setResult(null)
                    }
                  >
                    Upload Different File
                  </button>


                  <button
                    className="btn btn-primary"
                    onClick={continueToCompose}
                    disabled={
                      result.email_leads === 0
                    }
                    title={
                      result.email_leads === 0
                        ? "No email addresses were found."
                        : ""
                    }
                  >
                    Continue to Email Campaign →
                  </button>

                </div>

              </div>


              {/* ------------------------------------------------ */}
              {/* CONTACT STATS                                    */}
              {/* ------------------------------------------------ */}

              <div className="stats-grid">

                <div className="stat-card">

                  <div className="stat-label">
                    Total rows
                  </div>

                  <div className="stat-value">
                    {result.total_rows}
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-label">
                    Usable leads
                  </div>

                  <div className="stat-value">
                    {result.usable_leads}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#777",
                      marginTop: 5,
                    }}
                  >
                    Email or phone available
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-label">
                    Email leads
                  </div>

                  <div className="stat-value">
                    {result.email_leads}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#777",
                      marginTop: 5,
                    }}
                  >
                    Ready for email campaigns
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-label">
                    Phone leads
                  </div>

                  <div className="stat-value">
                    {result.phone_leads}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#777",
                      marginTop: 5,
                    }}
                  >
                    Ready for future call/WhatsApp tools
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-label">
                    No contact
                  </div>

                  <div className="stat-value">
                    {result.no_contact_rows}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#777",
                      marginTop: 5,
                    }}
                  >
                    No usable email or phone
                  </div>

                </div>

              </div>


              {/* ------------------------------------------------ */}
              {/* DETECTED COLUMNS                                 */}
              {/* ------------------------------------------------ */}

              <div
                className="card"
                style={{
                  marginBottom: 20,
                }}
              >

                <div className="card-header">

                  <h2 className="card-title">
                    Detected fields
                  </h2>

                  <p className="card-description">
                    Detection uses the actual cell values,
                    not only the column names.
                  </p>

                </div>


                <div
                  style={{
                    padding: 20,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 12,
                  }}
                >

                  <DetectionCard
                    label="Email"
                    column={result.email_column}
                    confidence={
                      result.email_confidence
                    }
                    required={false}
                  />


                  <DetectionCard
                    label="Phone"
                    column={result.phone_column}
                    confidence={
                      result.phone_confidence
                    }
                  />


                  <DetectionCard
                    label="Name"
                    column={result.name_column}
                    confidence={
                      result.name_confidence
                    }
                  />


                  <DetectionCard
                    label="Company"
                    column={result.company_column}
                    confidence={
                      result.company_confidence
                    }
                  />

                </div>

              </div>


              {/* ------------------------------------------------ */}
              {/* PHONE-ONLY NOTICE                                */}
              {/* ------------------------------------------------ */}

              {result.phone_leads > 0 && (

                <div
                  className="card"
                  style={{
                    marginBottom: 20,
                    padding: 18,
                    background: "#fffaf0",
                    borderColor: "#f0dfb4",
                  }}
                >

                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    📞 Phone leads were preserved
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6f6250",
                      lineHeight: 1.6,
                    }}
                  >
                    {result.phone_leads} usable leads contain
                    a phone number. They will not be treated as
                    invalid just because they have no email.
                    The current campaign sender only emails the
                    {result.email_leads} leads that have email
                    addresses.
                  </div>

                </div>

              )}


              {/* ------------------------------------------------ */}
              {/* LEAD TABLE                                       */}
              {/* ------------------------------------------------ */}

              <div className="card">

                <div className="card-header">

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >

                    <div>

                      <h2 className="card-title">
                        Leads
                      </h2>

                      <p className="card-description">
                        All usable leads are retained.
                      </p>

                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#777",
                      }}
                    >
                      {result.leads.length} leads
                    </div>

                  </div>

                </div>


                <div
                  style={{
                    overflowX: "auto",
                  }}
                >

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >

                    <thead>

                      <tr
                        style={{
                          background: "#fafafa",
                          borderBottom:
                            "1px solid #e8e8e8",
                        }}
                      >

                        <th style={tableHeader}>
                          #
                        </th>

                        <th style={tableHeader}>
                          Lead
                        </th>

                        <th style={tableHeader}>
                          Email
                        </th>

                        <th style={tableHeader}>
                          Phone
                        </th>

                        <th style={tableHeader}>
                          Company
                        </th>

                        <th style={tableHeader}>
                          Contact
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {result.leads.map(
                        (lead, index) => (

                          <tr
                            key={`${lead.email || lead.phone}-${index}`}
                            style={{
                              borderBottom:
                                "1px solid #eeeeee",
                            }}
                          >

                            <td style={tableCell}>
                              {index + 1}
                            </td>


                            <td style={tableCell}>

                              <div
                                style={{
                                  fontWeight: 650,
                                }}
                              >
                                {lead.name ||
                                  lead.company ||
                                  "Unknown"}
                              </div>

                            </td>


                            <td style={tableCell}>

                              {lead.email ? (
                                <span
                                  style={{
                                    color: "#555",
                                  }}
                                >
                                  {lead.email}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#aaa",
                                  }}
                                >
                                  —
                                </span>
                              )}

                            </td>


                            <td style={tableCell}>

                              {lead.phone ? (
                                <span
                                  style={{
                                    color: "#555",
                                  }}
                                >
                                  {lead.phone}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#aaa",
                                  }}
                                >
                                  —
                                </span>
                              )}

                            </td>


                            <td style={tableCell}>

                              {lead.company || "—"}

                            </td>


                            <td style={tableCell}>

                              <span
                                style={{
                                  display: "inline-flex",
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  background:
                                    lead.email
                                      ? "#edf9f1"
                                      : "#fff4db",
                                  color:
                                    lead.email
                                      ? "#18794e"
                                      : "#9a6b00",
                                  fontSize: 11,
                                  fontWeight: 650,
                                }}
                              >
                                {lead.email
                                  ? lead.phone
                                    ? "Email + Phone"
                                    : "Email"
                                  : "Phone"}
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* ------------------------------------------------ */}
              {/* BOTTOM ACTION                                    */}
              {/* ------------------------------------------------ */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >

                <button
                  className="btn btn-primary"
                  onClick={continueToCompose}
                  disabled={
                    result.email_leads === 0
                  }
                >
                  Review Email Leads →
                </button>

              </div>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* DETECTION CARD                                                             */
/* -------------------------------------------------------------------------- */

function DetectionCard({
  label,
  column,
  confidence,
  required = false,
}: {
  label: string;
  column: string | null;
  confidence: number;
  required?: boolean;
}) {

  const detected =
    Boolean(column);

  return (

    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 12,
        padding: 15,
        background: "#fff",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#777",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>


        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: detected
              ? "#18794e"
              : "#999",
          }}
        >
          {detected
            ? `${confidence}%`
            : required
              ? "Required"
              : "Not found"}
        </div>

      </div>


      <div
        style={{
          fontSize: 14,
          fontWeight: 650,
          wordBreak: "break-word",
        }}
      >
        {column || "No matching column"}
      </div>


      {detected && (

        <div
          style={{
            marginTop: 9,
            height: 5,
            background: "#eeeeee",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >

          <div
            style={{
              width: `${confidence}%`,
              height: "100%",
              background: "#18794e",
            }}
          />

        </div>

      )}

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* TABLE STYLES                                                               */
/* -------------------------------------------------------------------------- */

const tableHeader: React.CSSProperties = {
  padding: "13px 18px",
  textAlign: "left",
  color: "#777",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};


const tableCell: React.CSSProperties = {
  padding: "15px 18px",
  verticalAlign: "middle",
};


/* -------------------------------------------------------------------------- */
/* SIDEBAR                                                                    */
/* -------------------------------------------------------------------------- */

function Sidebar() {

  return (

    <aside className="sidebar">

      <div className="brand">

        <div className="brand-logo">
          R
        </div>

        <div>

          <div className="brand-name">
            Ritmailer
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

          <span>
            Dashboard
          </span>
        </a>


        <a
          href="/upload"
          className="nav-item active"
        >
          <span className="nav-icon">
            ↑
          </span>

          <span>
            New Campaign
          </span>
        </a>


        <a
          href="/upload"
          className="nav-item"
        >
          <span className="nav-icon">
            ▣
          </span>

          <span>
            Leads
          </span>
        </a>

      </nav>

    </aside>
  );
}


/* -------------------------------------------------------------------------- */
/* TOPBAR                                                                     */
/* -------------------------------------------------------------------------- */

function Topbar({
  title,
}: {
  title: string;
}) {

  return (

    <header className="topbar">

      <div className="topbar-title">
        {title}
      </div>


      <div className="account">

        <div
          style={{
            textAlign: "right",
          }}
        >

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Ritmailer
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#888",
            }}
          >
            Mailer Workspace
          </div>

        </div>


        <div className="account-avatar">
          R
        </div>

      </div>

    </header>
  );
}