"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


/* =========================================================
   CONFIG
========================================================= */

const API_URL = "";


/* =========================================================
   TYPES
========================================================= */

type Lead = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
};


type PersonalizedEmail = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  body: string;
};


type SendResultItem = {
  name?: string;
  email: string;
  status: string;
  error?: string;
  message_id?: string;
};


type SendResult = {
  success?: boolean;
  mode?: string;
  total?: number;
  sent?: number;
  failed?: number;
  results?: SendResultItem[];
};


/* =========================================================
   PAGE
========================================================= */

export default function SendingPage() {

  const router = useRouter();


  /* ---------------------------------------------------------
     STATUS
  --------------------------------------------------------- */

  const [
    status,
    setStatus,
  ] = useState<
    "loading" |
    "sending" |
    "completed" |
    "error"
  >("loading");


  const [
    result,
    setResult,
  ] = useState<SendResult | null>(
    null
  );


  const [
    error,
    setError,
  ] = useState("");


  const [
    progress,
    setProgress,
  ] = useState(0);


  /* ---------------------------------------------------------
     IMPORTANT:
     Prevent duplicate campaign execution in React Strict Mode.
  --------------------------------------------------------- */

  const hasStarted =
    useRef(false);


  /* =========================================================
     START AUTOMATICALLY
  ========================================================= */

  useEffect(() => {

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    startCampaign();

  }, []);


  /* =========================================================
     START CAMPAIGN
  ========================================================= */

  async function startCampaign() {

    try {

      // =======================================================
      // LOAD SESSION DATA
      // =======================================================

      const recipientsRaw =
        sessionStorage.getItem(
          "ritnavLeads"
        );


      const subject =
        sessionStorage.getItem(
          "ritnavSubject"
        ) || "";


      const message =
        sessionStorage.getItem(
          "ritnavMessage"
        ) || "";


      const aiMode =
        sessionStorage.getItem(
          "ritnavAIMode"
        ) === "true";


      const personalizedRaw =
        sessionStorage.getItem(
          "ritnavPersonalizedEmails"
        );

      const accountId =
        sessionStorage.getItem(
          "ritnavSendingAccountId"
        ) || "";

      const campaignId =
        sessionStorage.getItem(
          "ritnavCampaignId"
        ) || "";

      if (!accountId) {
        throw new Error(
          "Select a connected sending account before starting the campaign."
        );
      }


      // =======================================================
      // AI PERSONALIZED MODE
      // =======================================================

      if (aiMode) {

        await sendAIPersonalizedCampaign(
          personalizedRaw,
          accountId,
          campaignId
        );

        return;
      }


      // =======================================================
      // STANDARD MODE
      // =======================================================

      await sendStandardCampaign(
        recipientsRaw,
        subject,
        message,
        accountId,
        campaignId
      );

    } catch (err: unknown) {

      console.error(
        "Campaign error:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the campaign.";


      setError(
        message
      );


      setStatus(
        "error"
      );

    }

  }


  /* =========================================================
     AI CAMPAIGN
  ========================================================= */

  async function sendAIPersonalizedCampaign(
    personalizedRaw: string | null,
    accountId: string,
    campaignId: string
  ) {

    // ---------------------------------------------------------
    // CHECK AI DATA
    // ---------------------------------------------------------

    if (!personalizedRaw) {

      throw new Error(
        "No AI-generated emails were found. Please return to Compose and generate the emails again."
      );

    }


    let parsed: unknown;


    try {

      parsed =
        JSON.parse(
          personalizedRaw
        );

    } catch {

      throw new Error(
        "The saved AI-generated email data is invalid. Please generate the emails again."
      );

    }


    if (!Array.isArray(parsed)) {

      throw new Error(
        "The AI-generated email data is not in the correct format."
      );

    }


    // ---------------------------------------------------------
    // NORMALIZE + VALIDATE
    // ---------------------------------------------------------

    const personalizedEmails:
      PersonalizedEmail[] =
      parsed
        .map(
          (
            item: unknown
          ): PersonalizedEmail | null => {

            if (
              typeof item !==
                "object" ||
              item === null
            ) {

              return null;

            }


            const data =
              item as Record<
                string,
                unknown
              >;


            const email =
              typeof data.email ===
                "string"
                ? data.email.trim()
                : "";


            const itemSubject =
              typeof data.subject ===
                "string"
                ? data.subject.trim()
                : "";


            const body =
              typeof data.body ===
                "string"
                ? data.body.trim()
                : "";


            const name =
              typeof data.name ===
                "string"
                ? data.name.trim()
                : "";


            const phone =
              typeof data.phone ===
                "string"
                ? data.phone.trim()
                : "";


            const company =
              typeof data.company ===
                "string"
                ? data.company.trim()
                : "";


            if (
              !email ||
              !itemSubject ||
              !body
            ) {

              return null;

            }


            return {
              name,
              email,
              phone,
              company,
              subject:
                itemSubject,
              body,
            };

          }
        )
        .filter(
          (
            item
          ): item is PersonalizedEmail =>
            item !== null
        );


    // ---------------------------------------------------------
    // CHECK RECIPIENTS
    // ---------------------------------------------------------

    if (
      !personalizedEmails.length
    ) {

      throw new Error(
        "No valid AI-generated emails are available to send."
      );

    }


    // ---------------------------------------------------------
    // EMAIL VALIDATION
    // ---------------------------------------------------------

    const invalidEmail =
      personalizedEmails.find(
        (
          item
        ) =>
          !isValidEmail(
            item.email
          )
      );


    if (invalidEmail) {

      throw new Error(
        `Invalid email address in AI campaign: ${invalidEmail.email}`
      );

    }


    // ---------------------------------------------------------
    // START
    // ---------------------------------------------------------

    setStatus(
      "sending"
    );

    setProgress(
      10
    );


    // ---------------------------------------------------------
    // SEND
    // ---------------------------------------------------------

    const response =
      await fetch(
        `${API_URL}/api/send`,
        {
          method:
            "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              personalized_emails:
                personalizedEmails.map(
                  (
                    item
                  ) => ({
                    name:
                      item.name,
                    email:
                      item.email,
                    subject:
                      item.subject,
                    body:
                      item.body,
                  })
                ),
              account_id: accountId,
              campaign_id: campaignId || undefined,
            }),
        }
      );


    setProgress(
      60
    );


    // ---------------------------------------------------------
    // READ RESPONSE
    // ---------------------------------------------------------

    const data =
      await readJsonResponse(
        response
      );


    // ---------------------------------------------------------
    // API ERROR
    // ---------------------------------------------------------

    if (!response.ok) {

      throw new Error(
        extractApiError(
          data
        )
      );

    }


    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    setProgress(
      100
    );


    setResult(
      data as SendResult
    );


    setStatus(
      "completed"
    );

  }


  /* =========================================================
     STANDARD CAMPAIGN
  ========================================================= */

  async function sendStandardCampaign(
    recipientsRaw: string | null,
    subject: string,
    message: string,
    accountId: string,
    campaignId: string
  ) {

    // ---------------------------------------------------------
    // RECIPIENT STORAGE CHECK
    // ---------------------------------------------------------

    if (!recipientsRaw) {

      throw new Error(
        "No recipients found. Please upload your lead file again."
      );

    }


    let parsedRecipients:
      unknown;


    try {

      parsedRecipients =
        JSON.parse(
          recipientsRaw
        );

    } catch {

      throw new Error(
        "The saved lead data is invalid. Please upload your lead file again."
      );

    }


    if (
      !Array.isArray(
        parsedRecipients
      )
    ) {

      throw new Error(
        "The lead data is not in the correct format."
      );

    }


    // ---------------------------------------------------------
    // NORMALIZE RECIPIENTS
    // ---------------------------------------------------------

    const recipients:
      Lead[] =
      parsedRecipients
        .map(
          (
            recipient: unknown
          ): Lead | null => {

            // New object format

            if (
              typeof recipient ===
                "object" &&
              recipient !== null
            ) {

              const item =
                recipient as Record<
                  string,
                  unknown
                >;


              const email =
                typeof item.email ===
                  "string"
                  ? item.email.trim()
                  : "";


              const name =
                typeof item.name ===
                  "string"
                  ? item.name.trim()
                  : "";


              const phone =
                typeof item.phone ===
                  "string"
                  ? item.phone.trim()
                  : "";


              const company =
                typeof item.company ===
                  "string"
                  ? item.company.trim()
                  : "";


              if (!email) {
                return null;
              }


              return {
                name,
                email,
                phone,
                company,
              };

            }


            // Old format:
            // "person@example.com"

            if (
              typeof recipient ===
                "string"
            ) {

              const email =
                recipient.trim();


              if (!email) {
                return null;
              }


              return {
                name: "",
                email,
              };

            }


            return null;

          }
        )
        .filter(
          (
            recipient
          ): recipient is Lead =>
            recipient !== null
        );


    // ---------------------------------------------------------
    // VALID EMAILS
    // ---------------------------------------------------------

    const validRecipients =
      recipients.filter(
        (
          recipient
        ) =>
          isValidEmail(
            recipient.email
          )
      );


    if (
      !validRecipients.length
    ) {

      throw new Error(
        "No valid email addresses were found."
      );

    }


    // ---------------------------------------------------------
    // SUBJECT
    // ---------------------------------------------------------

    if (
      !subject.trim()
    ) {

      throw new Error(
        "Email subject is missing."
      );

    }


    // ---------------------------------------------------------
    // MESSAGE
    // ---------------------------------------------------------

    if (
      !message.trim()
    ) {

      throw new Error(
        "Email message is missing."
      );

    }


    // ---------------------------------------------------------
    // START
    // ---------------------------------------------------------

    setStatus(
      "sending"
    );


    setProgress(
      10
    );


    // ---------------------------------------------------------
    // SEND
    // ---------------------------------------------------------

    const response =
      await fetch(
        `${API_URL}/api/send`,
        {
          method:
            "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              recipients:
                validRecipients.map(
                  (
                    recipient
                  ) => ({
                    name:
                      recipient.name ||
                      "",
                    email:
                      recipient.email,
                  })
                ),

              subject:
                subject.trim(),

              body:
                message,
              account_id: accountId,
              campaign_id: campaignId || undefined,
            }),
        }
      );


    setProgress(
      60
    );


    // ---------------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------------

    const data =
      await readJsonResponse(
        response
      );


    // ---------------------------------------------------------
    // ERROR
    // ---------------------------------------------------------

    if (!response.ok) {

      throw new Error(
        extractApiError(
          data
        )
      );

    }


    // ---------------------------------------------------------
    // COMPLETE
    // ---------------------------------------------------------

    setProgress(
      100
    );


    setResult(
      data as SendResult
    );


    setStatus(
      "completed"
    );

  }


  /* =========================================================
     RENDER: LOADING
  ========================================================= */

  if (
    status ===
    "loading"
  ) {

    return (

      <div className="app-shell">

        <Sidebar />


        <div className="main-area">

          <Topbar
            title="Sending Campaign"
          />


          <main className="page">

            <div className="send-center">

              <div className="card">

                <div className="card-body">

                  <h1 className="page-title">
                    Preparing campaign...
                  </h1>


                  <p className="page-description">
                    Loading your recipients and
                    campaign details.
                  </p>


                  <div className="progress-track">

                    <div
                      className="progress-bar"
                      style={{
                        width:
                          "10%",
                      }}
                    />

                  </div>


                  <div className="progress-text">

                    <span>
                      Preparing
                    </span>


                    <span>
                      10%
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    );

  }


  /* =========================================================
     RENDER: SENDING
  ========================================================= */

  if (
    status ===
    "sending"
  ) {

    const isAI =
      typeof window !==
        "undefined" &&
      sessionStorage.getItem(
        "ritnavAIMode"
      ) === "true";


    return (

      <div className="app-shell">

        <Sidebar />


        <div className="main-area">

          <Topbar
            title="Sending Campaign"
          />


          <main className="page">

            <div className="send-center">

              <div className="card">

                <div className="card-body">

                  <h1 className="page-title">
                    Sending campaign
                  </h1>


                  <p className="page-description">

                    {isAI
                      ? "Your individually personalized emails are being sent."
                      : "Your emails are being processed."}

                  </p>


                  <div className="progress-track">

                    <div
                      className="progress-bar"
                      style={{
                        width:
                          `${progress}%`,
                      }}
                    />

                  </div>


                  <div className="progress-text">

                    <span>
                      {isAI
                        ? "Sending personalized emails..."
                        : "Sending emails..."}
                    </span>


                    <span>
                      {progress}%
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    );

  }


  /* =========================================================
     RENDER: ERROR
  ========================================================= */

  if (
    status ===
    "error"
  ) {

    return (

      <div className="app-shell">

        <Sidebar />


        <div className="main-area">

          <Topbar
            title="Campaign Error"
          />


          <main className="page">

            <div className="send-center">

              <div className="card">

                <div className="complete-box">

                  <div
                    style={{
                      width:
                        62,
                      height:
                        62,
                      borderRadius:
                        "50%",
                      background:
                        "#fff0f0",
                      color:
                        "#b42318",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      margin:
                        "0 auto 20px",
                      fontSize:
                        28,
                      fontWeight:
                        800,
                    }}
                  >
                    !
                  </div>


                  <h1 className="page-title">
                    Campaign could not be sent
                  </h1>


                  <p
                    className="page-description"
                    style={{
                      maxWidth:
                        650,
                      margin:
                        "10px auto 0",
                      whiteSpace:
                        "pre-line",
                    }}
                  >
                    {error}
                  </p>


                  <div
                    style={{
                      display:
                        "flex",
                      gap:
                        10,
                      justifyContent:
                        "center",
                      marginTop:
                        28,
                    }}
                  >

                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        router.push(
                          "/compose"
                        )
                      }
                    >
                      Back to Compose
                    </button>


                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        window.location.reload()
                      }
                    >
                      Try Again
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    );

  }


  /* =========================================================
     COMPLETED
  ========================================================= */

  return (

    <div className="app-shell">

      <Sidebar />


      <div className="main-area">

        <Topbar
          title="Campaign Completed"
        />


        <main className="page">

          <div className="send-center">

            <div className="card">

              <div className="complete-box">


                {/* SUCCESS ICON */}

                <div className="complete-icon">
                  ✓
                </div>


                {/* TITLE */}

                <h1 className="page-title">
                  Campaign Completed
                </h1>


                <p className="page-description">
                  Your email campaign has finished processing.
                </p>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="result-stats">

                  <div>

                    <div className="result-stat-value">
                      {result?.total ??
                        0}
                    </div>


                    <div className="result-stat-label">
                      Total
                    </div>

                  </div>


                  <div>

                    <div className="result-stat-value">
                      {result?.sent ??
                        0}
                    </div>


                    <div className="result-stat-label">
                      Sent
                    </div>

                  </div>


                  <div>

                    <div className="result-stat-value">
                      {result?.failed ??
                        0}
                    </div>


                    <div className="result-stat-label">
                      Failed
                    </div>

                  </div>

                </div>


                {/* =================================================
                    MODE
                ================================================= */}

                {result?.mode ===
                  "ai_personalized" && (

                  <div
                    style={{
                      marginTop:
                        18,
                      padding:
                        "9px 12px",
                      borderRadius:
                        8,
                      background:
                        "#f4f1ff",
                      color:
                        "#5b3ca5",
                      fontSize:
                        11,
                      fontWeight:
                        650,
                    }}
                  >
                    ✨ AI-personalized campaign
                  </div>

                )}


                {/* =================================================
                    RESULTS
                ================================================= */}

                {result?.results &&
                  result.results.length >
                    0 && (

                    <div
                      style={{
                        marginTop:
                          32,
                        textAlign:
                          "left",
                        width:
                          "100%",
                        overflowX:
                          "auto",
                      }}
                    >

                      <h2
                        style={{
                          fontSize:
                            16,
                          fontWeight:
                            700,
                          marginBottom:
                            12,
                        }}
                      >
                        Delivery Results
                      </h2>


                      <div
                        style={{
                          border:
                            "1px solid #e5e7eb",
                          borderRadius:
                            12,
                          overflow:
                            "hidden",
                        }}
                      >

                        {result.results.map(
                          (
                            recipient,
                            index
                          ) => (

                            <div
                              key={`${recipient.email}-${index}`}
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "1fr 1.4fr auto",
                                gap:
                                  12,
                                alignItems:
                                  "center",
                                padding:
                                  "12px 14px",
                                borderBottom:
                                  index ===
                                  result.results!.length -
                                    1
                                    ? "none"
                                    : "1px solid #eee",
                              }}
                            >

                              {/* NAME */}

                              <div>

                                <div
                                  style={{
                                    fontSize:
                                      13,
                                    fontWeight:
                                      650,
                                  }}
                                >
                                  {recipient.name ||
                                    "Unknown Lead"}
                                </div>

                              </div>


                              {/* EMAIL */}

                              <div
                                style={{
                                  fontSize:
                                    12,
                                  color:
                                    "#666",
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {
                                  recipient.email
                                }


                                {recipient.error && (

                                  <div
                                    style={{
                                      marginTop:
                                        4,
                                      color:
                                        "#b42318",
                                      fontSize:
                                        10,
                                    }}
                                  >
                                    {
                                      recipient.error
                                    }
                                  </div>

                                )}

                              </div>


                              {/* STATUS */}

                              <div
                                style={{
                                  fontSize:
                                    12,
                                  fontWeight:
                                    700,
                                  padding:
                                    "5px 9px",
                                  borderRadius:
                                    999,
                                  background:
                                    recipient.status ===
                                    "sent"
                                      ? "#ecfdf3"
                                      : "#fff0f0",
                                  color:
                                    recipient.status ===
                                    "sent"
                                      ? "#067647"
                                      : "#b42318",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {recipient.status ===
                                "sent"
                                  ? "Sent"
                                  : "Failed"}
                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                {/* =================================================
                    DASHBOARD
                ================================================= */}

                <button
                  className="btn btn-primary"
                  style={{
                    marginTop:
                      28,
                  }}
                  onClick={() =>
                    router.push(
                      "/"
                    )
                  }
                >
                  Back to Dashboard
                </button>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>

  );
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
  email: string
): boolean {

  const value =
    email.trim();


  if (!value) {
    return false;
  }


  if (
    value.includes(
      " "
    )
  ) {
    return false;
  }


  if (
    value.split("@")
      .length !== 2
  ) {
    return false;
  }


  const [
    local,
    domain,
  ] = value.split(
    "@"
  );


  if (
    !local ||
    !domain
  ) {
    return false;
  }


  if (
    !domain.includes(
      "."
    )
  ) {
    return false;
  }


  return true;
}


/* =========================================================
   READ JSON
========================================================= */

async function readJsonResponse(
  response: Response
): Promise<Record<string, unknown>> {

  try {

    return (
      await response.json()
    ) as Record<
      string,
      unknown
    >;

  } catch {

    throw new Error(
      "The server returned an invalid response."
    );

  }

}


/* =========================================================
   API ERROR
========================================================= */

function extractApiError(
  data: Record<string, unknown>
): string {

  const detail =
    data.detail;


  if (
    Array.isArray(
      detail
    )
  ) {

    return detail
      .map(
        (
          item: any
        ) => {

          const field =
            Array.isArray(
              item?.loc
            )
              ? item.loc.join(
                  "."
                )
              : "field";


          return `${field}: ${
            item?.msg ||
            "Invalid value."
          }`;

        }
      )
      .join(
        "\n"
      );

  }


  if (
    typeof detail ===
    "string"
  ) {

    return detail;

  }


  if (
    typeof data.error ===
    "string"
  ) {

    return data.error;

  }


  return (
    "The email campaign could not be sent."
  );
}


/* =========================================================
   SIDEBAR
========================================================= */

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
          className="nav-item"
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


/* =========================================================
   TOPBAR
========================================================= */

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
            textAlign:
              "right",
          }}
        >

          <div
            style={{
              fontSize:
                12,
              fontWeight:
                650,
            }}
          >
            Gmail
          </div>


          <div
            style={{
              fontSize:
                10,
              color:
                "#888",
            }}
          >
            Mail account
          </div>

        </div>


        <div className="account-avatar">
          R
        </div>

      </div>

    </header>

  );
}