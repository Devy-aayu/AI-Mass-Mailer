"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AIPersonalizer from "../../components/AIPersonalizer";

import type {
  AIGeneratedEmail,
} from "../../lib/api";
import { updateCampaign } from "../../lib/api";

import AccountSelector from "../../components/AccountSelector";

type Lead = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  business_name?: string;
  website?: string;
  category?: string;
  address?: string;
  description?: string;
};


export default function ComposePage() {

  const router = useRouter();


 
  const [
    leads,
    setLeads,
  ] = useState<Lead[]>([]);


  const [
    subject,
    setSubject,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


 
  const [
    aiEmails,
    setAiEmails,
  ] = useState<AIGeneratedEmail[]>(
    []
  );



  const [
    editingIndex,
    setEditingIndex,
  ] = useState<number | null>(
    null
  );



  const [
    showAIEmails,
    setShowAIEmails,
  ] = useState(true);



  useEffect(() => {

    const stored =
      sessionStorage.getItem(
        "ritnavLeads"
      );


    if (!stored) {

      router.push(
        "/upload"
      );

      return;
    }


    try {

      const parsed =
        JSON.parse(
          stored
        );


      if (
        !Array.isArray(
          parsed
        )
      ) {

        throw new Error(
          "Invalid lead data."
        );
      }


      

      const emailLeads =
        parsed.filter(
          (
            lead: unknown
          ): lead is Lead => {

            if (
              typeof lead !==
                "object" ||
              lead === null
            ) {
              return false;
            }


            const item =
              lead as Record<
                string,
                unknown
              >;


            return (
              typeof item.email ===
                "string" &&
              item.email.trim() !== ""
            );
          }
        );


      setLeads(
        emailLeads
      );



      const storedAI =
        sessionStorage.getItem(
          "ritnavPersonalizedEmails"
        );


      if (storedAI) {

        try {

          const parsedAI =
            JSON.parse(
              storedAI
            );


          if (
            Array.isArray(
              parsedAI
            )
          ) {

            setAiEmails(
              parsedAI
            );

          }

        } catch {

          sessionStorage.removeItem(
            "ritnavPersonalizedEmails"
          );

        }

      }

    } catch {

      sessionStorage.removeItem(
        "ritnavLeads"
      );

      router.push(
        "/upload"
      );

    }

  }, [router]);


  
  function insertName() {

    setMessage(
      (
        current
      ) =>
        `${current}{{name}}`
    );

  }




  function handleAIGenerated(
    emails: AIGeneratedEmail[]
  ) {

    

    const copied =
      emails.map(
        (email) => ({
          ...email,
        })
      );


    setAiEmails(
      copied
    );


    sessionStorage.setItem(
      "ritnavPersonalizedEmails",
      JSON.stringify(
        copied
      )
    );


    sessionStorage.setItem(
      "ritnavAIMode",
      "true"
    );


    setShowAIEmails(
      true
    );

  }


  

  function updateAIEmail(
    index: number,
    field:
      | "subject"
      | "body",
    value: string
  ) {

    setAiEmails(
      (current) => {

        const updated =
          [...current];


        updated[index] = {
          ...updated[index],
          [field]: value,
        };


        

        sessionStorage.setItem(
          "ritnavPersonalizedEmails",
          JSON.stringify(
            updated
          )
        );


        return updated;
      }
    );

  }


  function disableAIMode() {

    setAiEmails(
      []
    );


    sessionStorage.removeItem(
      "ritnavPersonalizedEmails"
    );


    sessionStorage.setItem(
      "ritnavAIMode",
      "false"
    );


    setEditingIndex(
      null
    );

  }




  function sendAIGeneratedEmails() {

    if (
      aiEmails.length === 0
    ) {

      alert(
        "No AI-generated emails are available."
      );

      return;
    }


   

    const invalid =
      aiEmails.find(
        (email) =>
          !email.email.trim() ||
          !email.subject.trim() ||
          !email.body.trim()
      );


    if (invalid) {

      alert(
        "One or more AI emails are incomplete. Please check the edited emails before sending."
      );

      return;
    }


   

    sessionStorage.setItem(
      "ritnavPersonalizedEmails",
      JSON.stringify(
        aiEmails
      )
    );


    sessionStorage.setItem(
      "ritnavAIMode",
      "true"
    );


  

    sessionStorage.setItem(
      "ritnavSubject",
      subject
    );


    sessionStorage.setItem(
      "ritnavMessage",
      message
    );


    
    router.push(
      "/sending"
    );

  }


  

  async function continueStandardCampaign() {

    if (
      !leads.length
    ) {

      alert(
        "There are no email recipients."
      );

      return;
    }


    if (
      !subject.trim()
    ) {

      alert(
        "Please enter an email subject."
      );

      return;
    }


    if (
      !message.trim()
    ) {

      alert(
        "Please enter your email message."
      );

      return;
    }


    sessionStorage.setItem(
      "ritnavSubject",
      subject
    );


    sessionStorage.setItem(
      "ritnavMessage",
      message
    );


    sessionStorage.setItem(
      "ritnavAIMode",
      "false"
    );


    sessionStorage.removeItem(
      "ritnavPersonalizedEmails"
    );

    const campaignId = sessionStorage.getItem("ritnavCampaignId");
    if (campaignId) {
      try {
        await updateCampaign(campaignId, {
          subject,
          body: message,
          account_id: sessionStorage.getItem("ritnavSendingAccountId") || undefined,
          ai_enabled: false,
        });
      } catch (error) {
        console.error("Could not save campaign draft:", error);
      }
    }

    router.push(
      "/sending"
    );

  }



  function previewMessage() {

    if (
      !leads.length
    ) {

      return;
    }


    const first =
      leads[0];


    const displayName =
      first.name ||
      first.company ||
      "there";


    const preview =
      message.replaceAll(
        "{{name}}",
        displayName
      );


    alert(
      `Preview for ${displayName}:\n\n${preview}`
    );

  }



  return (

    <div className="app_shell">

      <Sidebar />


      <div className="main_area">

        <Topbar
          title="Compose Campaign"
        />


        <main className="page">

          

          <div className="page_header">

            <div>

              <h1 className="page_title">
                Compose email
              </h1>


              <p className="page_description">
                Write your campaign, personalize it with AI,
                edit the generated messages, then send.
              </p>

            </div>


            <div
              style={{
                padding:
                  "8px 12px",
                background:
                  "#edf9f1",
                color:
                  "#18794e",
                borderRadius:
                  9,
                fontSize:
                  12,
                fontWeight:
                  650,
              }}
            >
              OK {leads.length} email recipients
            </div>

          </div>


          

          <div
            className="composer_layout"
          >

           

            <div>


             

              <div className="card">

                <div className="card_header">

                  <h2 className="card_title">
                    Email
                  </h2>


                  <p className="card_description">
                    Create your base campaign.
                    AI can personalize it for every recipient.
                  </p>

                </div>


                <div className="card_body">


                

                  <div className="field">

                    <label className="field_label">
                      Subject
                    </label>


                    <input
                      className="input"
                      value={subject}
                      onChange={(
                        event
                      ) =>
                        setSubject(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Free AI Automation Demo for your business"
                    />

                  </div>


                

                  <div className="field">

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        marginBottom:
                          8,
                      }}
                    >

                      <label className="field_label">
                        Message
                      </label>


                      <button
                        type="button"
                        className="btn btn_secondary"
                        style={{
                          padding:
                            "6px 9px",
                          fontSize:
                            11,
                        }}
                        onClick={
                          insertName
                        }
                      >
                        + Insert lead name
                      </button>

                    </div>


                    <textarea
                      className="textarea"
                      value={message}
                      onChange={(
                        event
                      ) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      placeholder={`Hello {{name}},

We would like to offer you a free demo of our services.

Best regards,
Ritmailer`}
                    />


                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        marginTop:
                          7,
                        fontSize:
                          11,
                        color:
                          "#888",
                      }}
                    >

                      <span>
                        Use{" "}
                        <strong>
                          {"{{name}}"}
                        </strong>{" "}
                        for basic personalization.
                      </span>


                      <span>
                        {message.length} characters
                      </span>

                    </div>

                  </div>



                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      paddingTop:
                        10,
                      borderTop:
                        "1px solid #eee",
                    }}
                  >

                    <button
                      type="button"
                      className="btn btn_secondary"
                      onClick={() =>
                        router.push(
                          "/upload"
                        )
                      }
                    >
                      Back Back to Leads
                    </button>


                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          10,
                      }}
                    >

                      <button
                        type="button"
                        className="btn btn_secondary"
                        onClick={
                          previewMessage
                        }
                      >
                        Preview
                      </button>


                      {aiEmails.length ===
                        0 && (

                        <button
                          type="button"
                          className="btn btn_primary"
                          onClick={
                            continueStandardCampaign
                          }
                        >
                          Review & Send
                        </button>

                      )}

                    </div>

                  </div>

                </div>

              </div>


              <AccountSelector />
              
              <AIPersonalizer
                leads={
                  leads
                }
                baseSubject={
                  subject
                }
                baseMessage={
                  message
                }
                onGenerated={
                  handleAIGenerated
                }
              />


             

              {aiEmails.length > 0 && (

                <div
                  className="card"
                  style={{
                    marginTop:
                      16,
                  }}
                >

                  <div
                    className="card_body"
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          14,
                      }}
                    >

                      <div>

                        <div
                          style={{
                            fontSize:
                              14,
                            fontWeight:
                              750,
                          }}
                        >
                          {" "}
                          {aiEmails.length}{" "}
                          AI-personalized emails ready
                        </div>


                        <div
                          style={{
                            marginTop:
                              5,
                            fontSize:
                              11,
                            color:
                              "#777",
                          }}
                        >
                          Edit any message below before sending.
                        </div>

                      </div>


                      <button
                        type="button"
                        className="btn btn_secondary"
                        onClick={
                          disableAIMode
                        }
                      >
                        Use Standard Email
                      </button>

                    </div>

                  </div>

                </div>

              )}


              

              {aiEmails.length > 0 && (

                <div
                  className="card"
                  style={{
                    marginTop:
                      16,
                  }}
                >

                  <div className="card_header">

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                      }}
                    >

                      <div>

                        <h2 className="card_title">
                          AI-generated emails
                        </h2>


                        <p className="card_description">
                          Every recipient has their own subject
                          and message.
                        </p>

                      </div>


                      <button
                        type="button"
                        className="btn btn_secondary"
                        onClick={() =>
                          setShowAIEmails(
                            !showAIEmails
                          )
                        }
                      >
                        {showAIEmails
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>

                  </div>


                  {showAIEmails && (

                    <div className="card_body">

                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap:
                            14,
                        }}
                      >

                        {aiEmails.map(
                          (
                            email,
                            index
                          ) => {

                            const isEditing =
                              editingIndex ===
                              index;


                            return (

                              <div
                                key={`${email.email}-${index}`}
                                style={{
                                  border:
                                    "1px solid #e2e2e2",
                                  borderRadius:
                                    12,
                                  overflow:
                                    "hidden",
                                  background:
                                    "#fff",
                                }}
                              >

                               

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    alignItems:
                                      "center",
                                    gap:
                                      12,
                                    padding:
                                      "12px 14px",
                                    background:
                                      "#fafafa",
                                    borderBottom:
                                      "1px solid #eeeeee",
                                  }}
                                >

                                  <div
                                    style={{
                                      minWidth:
                                        0,
                                    }}
                                  >

                                    <div
                                      style={{
                                        fontSize:
                                          12,
                                        fontWeight:
                                          750,
                                      }}
                                    >
                                      {email.name ||
                                        email.company ||
                                        "Unnamed lead"}
                                    </div>


                                    <div
                                      style={{
                                        marginTop:
                                          3,
                                        fontSize:
                                          10,
                                        color:
                                          "#888",
                                        wordBreak:
                                          "break-all",
                                      }}
                                    >
                                      {
                                        email.email
                                      }
                                    </div>

                                  </div>


                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      gap:
                                        8,
                                      flexShrink:
                                        0,
                                    }}
                                  >

                                    <span
                                      style={{
                                        padding:
                                          "4px 8px",
                                        borderRadius:
                                          999,
                                        background:
                                          "#edf9f1",
                                        color:
                                          "#18794e",
                                        fontSize:
                                          10,
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      Ready
                                    </span>


                                    <button
                                      type="button"
                                      className="btn btn_secondary"
                                      style={{
                                        padding:
                                          "5px 10px",
                                        fontSize:
                                          11,
                                      }}
                                      onClick={() => {

                                        setEditingIndex(
                                          isEditing
                                            ? null
                                            : index
                                        );

                                      }}
                                    >
                                      {isEditing
                                        ? "Done"
                                        : "Edit Edit"}
                                    </button>

                                  </div>

                                </div>


                            

                                <div
                                  style={{
                                    padding:
                                      14,
                                  }}
                                >

                                  {isEditing ? (

                                    <>

                                 

                                      <div
                                        className="field"
                                      >

                                        <label
                                          className="field_label"
                                        >
                                          Subject
                                        </label>


                                        <input
                                          className="input"
                                          value={
                                            email.subject
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateAIEmail(
                                              index,
                                              "subject",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                        />

                                      </div>


                                      

                                      <div
                                        className="field"
                                      >

                                        <label
                                          className="field_label"
                                        >
                                          Message
                                        </label>


                                        <textarea
                                          className="textarea"
                                          value={
                                            email.body
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateAIEmail(
                                              index,
                                              "body",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          style={{
                                            minHeight:
                                              180,
                                          }}
                                        />

                                      </div>


                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          justifyContent:
                                            "flex-end",
                                        }}
                                      >

                                        <button
                                          type="button"
                                          className="btn btn_primary"
                                          onClick={() =>
                                            setEditingIndex(
                                              null
                                            )
                                          }
                                        >
                                          Save Changes
                                        </button>

                                      </div>

                                    </>

                                  ) : (

                                    <>

                                     

                                      <div
                                        style={{
                                          fontSize:
                                            10,
                                          color:
                                            "#888",
                                          marginBottom:
                                            5,
                                          textTransform:
                                            "uppercase",
                                          letterSpacing:
                                            ".04em",
                                          fontWeight:
                                            700,
                                        }}
                                      >
                                        Subject
                                      </div>


                                      <div
                                        style={{
                                          fontSize:
                                            13,
                                          fontWeight:
                                            700,
                                          marginBottom:
                                            14,
                                        }}
                                      >
                                        {
                                          email.subject
                                        }
                                      </div>


                                     

                                      <div
                                        style={{
                                          fontSize:
                                            11,
                                          color:
                                            "#777",
                                          marginBottom:
                                            5,
                                          textTransform:
                                            "uppercase",
                                          letterSpacing:
                                            ".04em",
                                          fontWeight:
                                            700,
                                        }}
                                      >
                                        Message
                                      </div>


                                      <div
                                        style={{
                                          fontSize:
                                            12,
                                          color:
                                            "#444",
                                          lineHeight:
                                            1.65,
                                          whiteSpace:
                                            "pre-wrap",
                                        }}
                                      >
                                        {
                                          email.body
                                        }
                                      </div>

                                    </>

                                  )}

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>


                     

                      <div
                        style={{
                          marginTop:
                            20,
                          paddingTop:
                            18,
                          borderTop:
                            "1px solid #eeeeee",
                        }}
                      >

                        <div
                          style={{
                            marginBottom:
                              12,
                            fontSize:
                              11,
                            color:
                              "#777",
                          }}
                        >
                          {aiEmails.length}{" "}
                          individualized emails will be sent
                          to the corresponding recipients.
                        </div>


                        <button
                          type="button"
                          className="btn btn_primary"
                          style={{
                            width:
                              "100%",
                            minHeight:
                              44,
                            fontSize:
                              13,
                            fontWeight:
                              750,
                          }}
                          onClick={
                            sendAIGeneratedEmails
                          }
                        >
                           Send AI Generated Mails 
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>


            

            <div
              className="card recipient_card"
              style={{
                overflow:
                  "hidden",
                alignSelf:
                  "flex-start",
              }}
            >

              <div className="card_header">

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >

                  <div>

                    <h2 className="card_title">
                      Recipients
                    </h2>


                    <p className="card_description">
                      People receiving the email.
                    </p>

                  </div>


                  <div
                    style={{
                      fontSize:
                        22,
                      fontWeight:
                        750,
                    }}
                  >
                    {
                      leads.length
                    }
                  </div>

                </div>

              </div>


              

              <div
                style={{
                  maxHeight:
                    560,
                  overflowY:
                    "auto",
                }}
              >

                {leads.map(
                  (
                    lead,
                    index
                  ) => (

                    <div
                      key={`${lead.email}-${index}`}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          10,
                        padding:
                          "12px 14px",
                        borderBottom:
                          "1px solid #eeeeee",
                      }}
                    >

                      

                      <div
                        style={{
                          width:
                            32,
                          height:
                            32,
                          borderRadius:
                            "50%",
                          background:
                            "#f1f1f1",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize:
                            11,
                          fontWeight:
                            750,
                          flexShrink:
                            0,
                        }}
                      >
                        {(
                          lead.name ||
                          lead.company ||
                          lead.email ||
                          "?"
                        )
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>


                     

                      <div
                        style={{
                          minWidth:
                            0,
                          flex:
                            1,
                        }}
                      >

                        <div
                          style={{
                            fontSize:
                              12,
                            fontWeight:
                              650,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            lead.name ||
                            lead.company ||
                            "Unnamed lead"
                          }
                        </div>


                        <div
                          style={{
                            fontSize:
                              10,
                            color:
                              "#888",
                            marginTop:
                              2,
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            lead.email
                          }
                        </div>

                      </div>


                     

                      {aiEmails.some(
                        (
                          email
                        ) =>
                          email.email
                            .toLowerCase() ===
                          lead.email
                            .toLowerCase()
                      ) && (

                        <span
                          title="AI personalized"
                          style={{
                            fontSize:
                              12,
                            flexShrink:
                              0,
                          }}
                        >
                          
                        </span>

                      )}

                    </div>

                  )
                )}

              </div>



              <div
                style={{
                  padding:
                    13,
                  background:
                    "#fafafa",
                  borderTop:
                    "1px solid #eee",
                  fontSize:
                    10,
                  color:
                    "#777",
                }}
              >

                {aiEmails.length > 0 ? (

                  <>
                    {" "}
                    {
                      aiEmails.length
                    }{" "}
                    AI-personalized emails ready.
                  </>

                ) : (

                  <>
                    OK{" "}
                    {
                      leads.length
                    }{" "}
                    email addresses are ready.
                  </>

                )}

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

          <span>
            Dashboard
          </span>
        </a>


        <a
          href="/upload"
          className="nav_item active"
        >
          <span className="nav_icon">
            New
          </span>

          <span>
            New Campaign
          </span>
        </a>

      

        <a
          href="/automations"
          className="nav_item"
        >
          <span className="nav_icon">Soon</span>
          <span>Automations</span>
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
