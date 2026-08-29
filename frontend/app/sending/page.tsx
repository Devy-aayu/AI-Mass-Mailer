"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

const API_URL = "";
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



export default function SendingPage() {

  const router = useRouter();


  
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
  const hasStarted =
    useRef(false);



  useEffect(() => {

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    startCampaign();

  }, []);


 

  async function startCampaign() {

    try {

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


      

      if (aiMode) {

        await sendAIPersonalizedCampaign(
          personalizedRaw,
          accountId,
          campaignId
        );

        return;
      }



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



  async function sendAIPersonalizedCampaign(
    personalizedRaw: string | null,
    accountId: string,
    campaignId: string
  ) {


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



    if (
      !personalizedEmails.length
    ) {

      throw new Error(
        "No valid AI-generated emails are available to send."
      );

    }



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



    setStatus(
      "sending"
    );

    setProgress(
      10
    );



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



    const data =
      await readJsonResponse(
        response
      );



    if (!response.ok) {

      throw new Error(
        extractApiError(
          data
        )
      );

    }



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



  async function sendStandardCampaign(
    recipientsRaw: string | null,
    subject: string,
    message: string,
    accountId: string,
    campaignId: string
  ) {


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



    const recipients:
      Lead[] =
      parsedRecipients
        .map(
          (
            recipient: unknown
          ): Lead | null => {


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



    if (
      !subject.trim()
    ) {

      throw new Error(
        "Email subject is missing."
      );

    }



    if (
      !message.trim()
    ) {

      throw new Error(
        "Email message is missing."
      );

    }



    setStatus(
      "sending"
    );


    setProgress(
      10
    );



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



    const data =
      await readJsonResponse(
        response
      );


    

    if (!response.ok) {

      throw new Error(
        extractApiError(
          data
        )
      );

    }


   

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



  if (
    status ===
    "loading"
  ) {

    return (

      <div className="app_shell">

        <Sidebar />


        <div className="main_area">

          <Topbar
            title="Sending Campaign"
          />


          <main className="page">

            <div className="send_center">

              <div className="card">

                <div className="card_body">

                  <h1 className="page_title">
                    Preparing campaign...
                  </h1>


                  <p className="page_description">
                    Loading your recipients and
                    campaign details.
                  </p>


                  <div className="progress_track">

                    <div
                      className="progress_bar"
                      style={{
                        width:
                          "10%",
                      }}
                    />

                  </div>


                  <div className="progress_text">

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

      <div className="app_shell">

        <Sidebar />


        <div className="main_area">

          <Topbar
            title="Sending Campaign"
          />


          <main className="page">

            <div className="send_center">

              <div className="card">

                <div className="card_body">

                  <h1 className="page_title">
                    Sending campaign
                  </h1>


                  <p className="page_description">

                    {isAI
                      ? "Your individually personalized emails are being sent."
                      : "Your emails are being processed."}

                  </p>


                  <div className="progress_track">

                    <div
                      className="progress_bar"
                      style={{
                        width:
                          `${progress}%`,
                      }}
                    />

                  </div>


                  <div className="progress_text">

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


  if (
    status ===
    "error"
  ) {

    return (

      <div className="app_shell">

        <Sidebar />


        <div className="main_area">

          <Topbar
            title="Campaign Error"
          />


          <main className="page">

            <div className="send_center">

              <div className="card">

                <div className="complete_box">

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


                  <h1 className="page_title">
                    Campaign could not be sent
                  </h1>


                  <p
                    className="page_description"
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
                      className="btn btn_secondary"
                      onClick={() =>
                        router.push(
                          "/compose"
                        )
                      }
                    >
                      Back to Compose
                    </button>


                    <button
                      className="btn btn_primary"
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


  return (

    <div className="app_shell">

      <Sidebar />


      <div className="main_area">

        <Topbar
          title="Campaign Completed"
        />


        <main className="page">

          <div className="send_center">

            <div className="card">

              <div className="complete_box">



                <div className="complete_icon">
                  
                </div>



                <h1 className="page_title">
                  Campaign Completed
                </h1>


                <p className="page_description">
                  Your email campaign has finished processing.
                </p>


               

                <div className="result_stats">

                  <div>

                    <div className="result_stat_value">
                      {result?.total ??
                        0}
                    </div>


                    <div className="result_stat_label">
                      Total
                    </div>

                  </div>


                  <div>

                    <div className="result_stat_value">
                      {result?.sent ??
                        0}
                    </div>


                    <div className="result_stat_label">
                      Sent
                    </div>

                  </div>


                  <div>

                    <div className="result_stat_value">
                      {result?.failed ??
                        0}
                    </div>


                    <div className="result_stat_label">
                      Failed
                    </div>

                  </div>

                </div>


               

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
                     AI-personalized campaign
                  </div>

                )}



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


                

                <button
                  className="btn btn_primary"
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


          <span>
            Dashboard
          </span>

        </a>


        <a
          href="/upload"
          className="nav_item"
        >

          <span className="nav_icon">
            New
          </span>


          <span>
            New Campaign
          </span>

        </a>


        <a
          href="/upload"
          className="nav_item"
        >

          <span className="nav_icon">
            Leads
          </span>


          <span>
            Leads
          </span>

        </a>

      </nav>

    </aside>

  );
}




function Topbar({
  title,
}: {
  title: string;
}) {

  return (

    <header className="topbar">

      <div className="topbar_title">
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


        <div className="account_avatar">
          R
        </div>

      </div>

    </header>

  );
}
