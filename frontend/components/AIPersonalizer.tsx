"use client";

import {
  useState,
} from "react";

import {
  generatePersonalizedEmails,
  getAIConfig,
  Lead,
  AIGeneratedEmail,
} from "../lib/api";


type Props = {
  leads: Lead[];

  baseSubject: string;

  baseMessage: string;

  onGenerated: (
    emails: AIGeneratedEmail[]
  ) => void;
};


export default function AIPersonalizer({
  leads,
  baseSubject,
  baseMessage,
  onGenerated,
}: Props) {

  const [
    campaignGoal,
    setCampaignGoal,
  ] = useState("");

  const [
    tone,
    setTone,
  ] = useState(
    "professional"
  );

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState("");

  const [
    needsAISetup,
    setNeedsAISetup,
  ] = useState(false);

  const [
    generated,
    setGenerated,
  ] = useState<AIGeneratedEmail[]>(
    []
  );


  const emailLeads =
    leads.filter(
      (
        lead
      ) =>
        Boolean(
          lead.email?.trim()
        )
    );


  async function generate() {

    setError("");
    setNeedsAISetup(false);

    // CRITICAL:
    // Remove old successful results before starting.
    setGenerated([]);

    sessionStorage.removeItem(
      "ritnavPersonalizedEmails"
    );

    sessionStorage.setItem(
      "ritnavAIMode",
      "false"
    );


    if (!campaignGoal.trim()) {

      setError(
        "Please describe what you are offering and what you want the recipient to do."
      );

      return;
    }


    if (!emailLeads.length) {

      setError(
        "No email-capable leads were found."
      );

      return;
    }


    try {
      const { config } = await getAIConfig();
      if (!config?.configured) {
        setNeedsAISetup(true);
        setError("AI generation is not configured for your account. Add your API key and model first.");
        return;
      }
    } catch (configError) {
      setError(configError instanceof Error ? configError.message : "Could not verify AI configuration.");
      return;
    }

    setGenerating(
      true
    );

    setProgress(
      0
    );


    try {

      const batchSize = 5;

      const allResults:
        AIGeneratedEmail[] = [];


      for (
        let start = 0;
        start < emailLeads.length;
        start += batchSize
      ) {

        const batch =
          emailLeads.slice(
            start,
            start + batchSize
          );


        const response =
          await generatePersonalizedEmails(
            batch,
            campaignGoal,
            baseSubject,
            baseMessage,
            tone
          );


        allResults.push(
          ...response.results
        );


        const completed =
          Math.min(
            start + batch.length,
            emailLeads.length
          );


        setProgress(
          Math.round(
            (
              completed /
              emailLeads.length
            ) * 100
          )
        );
      }


      if (
        allResults.length !==
        emailLeads.length
      ) {

        throw new Error(
          `AI generated ${allResults.length} of ${emailLeads.length} emails. Please try again with fewer leads or regenerate the campaign.`
        );
      }


      const normalized =
        allResults.map(
          (
            item,
            index
          ) => ({
            ...item,
            index,
          })
        );


      setGenerated(
        normalized
      );


      sessionStorage.setItem(
        "ritnavPersonalizedEmails",
        JSON.stringify(
          normalized
        )
      );


      sessionStorage.setItem(
        "ritnavAIMode",
        "true"
      );


      onGenerated(
        normalized
      );


    } catch (
      errorValue: unknown
    ) {

      // CRITICAL:
      // Do not leave stale results around after failure.
      setGenerated([]);

      sessionStorage.removeItem(
        "ritnavPersonalizedEmails"
      );

      sessionStorage.setItem(
        "ritnavAIMode",
        "false"
      );


      const errorMessage = errorValue instanceof Error
        ? errorValue.message
        : "AI generation failed.";
      setNeedsAISetup(/not configured|API key|AI configuration/i.test(errorMessage));
      setError(errorMessage);


    } finally {

      setGenerating(
        false
      );
    }
  }


  return (

    <div
      className="card"
      style={{
        marginTop: 20,
      }}
    >

      <div className="card-header">

        <h2 className="card-title">
          ✨ AI Lead Intelligence
        </h2>


        <p className="card-description">
          AI analyzes the original lead data,
          identifies the business context,
          then writes a business-specific email.
        </p>

      </div>


      <div className="card-body">

        <div className="field">

          <label className="field-label">
            What are you offering?
          </label>


          <textarea
            className="textarea"
            value={
              campaignGoal
            }
            onChange={(
              event
            ) =>
              setCampaignGoal(
                event.target.value
              )
            }
            placeholder={`Example:

Ritnav provides website development, AI automation and custom software solutions for small and medium businesses.

Our goal is to start a genuine business conversation and offer a short introductory consultation.

For clinics, use a clinic-relevant angle.
For grocery businesses, use a grocery/retail-relevant angle.
For hotels, use a hospitality-relevant angle.
For restaurants, use a restaurant-relevant angle.

Never invent problems or pretend that we have contacted the business before.`}
            style={{
              minHeight: 200,
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />


          <div
            style={{
              marginTop: 7,
              display: "flex",
              justifyContent:
                "space-between",
              gap: 12,
              fontSize: 11,
              color: "#888",
            }}
          >

            <span>
              You can paste a detailed campaign brief here.
            </span>


            <span>
              {
                campaignGoal.length
              }{" "}
              chars
            </span>

          </div>

        </div>


        <div className="field">

          <label className="field-label">
            Tone
          </label>


          <select
            className="input"
            value={tone}
            onChange={(
              event
            ) =>
              setTone(
                event.target.value
              )
            }
          >

            <option value="professional">
              Professional
            </option>

            <option value="friendly">
              Friendly
            </option>

            <option value="consultative">
              Consultative
            </option>

            <option value="concise">
              Concise
            </option>

          </select>

        </div>


        <button
          type="button"
          className="btn btn-primary"
          disabled={
            generating ||
            !emailLeads.length
          }
          onClick={
            generate
          }
          style={{
            width: "100%",
            minHeight: 44,
          }}
        >

          {generating
            ? `Analyzing leads ${progress}%...`
            : `Analyze & personalize ${emailLeads.length} leads`}

        </button>


        {generating && (

          <div
            style={{
              marginTop: 12,
            }}
          >

            <div
              style={{
                height: 7,
                borderRadius: 999,
                background:
                  "#eeeeee",
                overflow:
                  "hidden",
              }}
            >

              <div
                style={{
                  width:
                    `${progress}%`,
                  height:
                    "100%",
                  background:
                    "#18794e",
                  transition:
                    "width 0.2s ease",
                }}
              />

            </div>


            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                color: "#777",
              }}
            >
              AI is analyzing the original spreadsheet
              fields before writing the emails.
            </div>

          </div>

        )}


        {error && (

          <div
            style={{
              marginTop: 13,
              padding: 13,
              borderRadius: 9,
              background:
                "#fff0f0",
              color:
                "#b42318",
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace:
                "pre-wrap",
            }}
          >
            <div>{error}</div>
            {needsAISetup && (
              <a href="/settings/ai" style={{ display: "inline-block", marginTop: 8, fontWeight: 700, color: "inherit" }}>
                Configure AI →
              </a>
            )}
          </div>

        )}


        {generated.length > 0 && (

          <div
            style={{
              marginTop: 22,
            }}
          >

            <div
              style={{
                fontSize: 13,
                fontWeight: 750,
                marginBottom: 10,
              }}
            >
              What AI understood
            </div>


            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: 10,
              }}
            >

              {generated
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    email,
                    index
                  ) => (

                    <div
                      key={`${email.email}-${index}`}
                      style={{
                        border:
                          "1px solid #e5e5e5",
                        borderRadius:
                          10,
                        padding:
                          13,
                        background:
                          "#fafafa",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >

                        <div>

                          <div
                            style={{
                              fontSize:
                                12,
                              fontWeight:
                                750,
                            }}
                          >
                            {email.analysis
                              .business_name ||
                              email.company ||
                              email.email}
                          </div>


                          <div
                            style={{
                              marginTop:
                                3,
                              fontSize:
                                10,
                              color:
                                "#888",
                            }}
                          >
                            {
                              email.email
                            }
                          </div>

                        </div>


                        <span
                          style={{
                            flexShrink:
                              0,
                            padding:
                              "4px 7px",
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
                          {Math.round(
                            email.analysis
                              .confidence *
                              100
                          )}%
                        </span>

                      </div>


                      <div
                        style={{
                          marginTop:
                            10,
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap:
                            7,
                          fontSize:
                            11,
                          lineHeight:
                            1.5,
                        }}
                      >

                        <div>
                          <b>
                            Person:
                          </b>{" "}
                          {
                            email.analysis
                              .person_name ||
                            "Not identified"
                          }
                        </div>


                        <div>
                          <b>
                            Business:
                          </b>{" "}
                          {
                            email.analysis
                              .business_name ||
                            "Not identified"
                          }
                        </div>


                        <div>
                          <b>
                            Type:
                          </b>{" "}
                          {
                            email.analysis
                              .business_type
                          }
                        </div>


                        <div>
                          <b>
                            Industry:
                          </b>{" "}
                          {
                            email.analysis
                              .industry
                          }
                        </div>


                        <div>
                          <b>
                            Role:
                          </b>{" "}
                          {
                            email.analysis
                              .contact_role
                          }
                        </div>


                        <div>
                          <b>
                            Greeting:
                          </b>{" "}
                          {
                            email.analysis
                              .greeting
                          }
                        </div>

                      </div>


                      <div
                        style={{
                          marginTop:
                            9,
                          paddingTop:
                            9,
                          borderTop:
                            "1px solid #e5e5e5",
                          fontSize:
                            11,
                          color:
                            "#666",
                        }}
                      >

                        <b>
                          Personalization angle:
                        </b>{" "}

                        {
                          email.analysis
                            .personalization_angle
                        }

                      </div>


                      {/* -----------------------------------------
                          RAW SOURCE DATA
                      ----------------------------------------- */}

                      <div
                        style={{
                          marginTop:
                            9,
                          paddingTop:
                            9,
                          borderTop:
                            "1px solid #e5e5e5",
                          fontSize:
                            10,
                          color:
                            "#777",
                          lineHeight:
                            1.45,
                        }}
                      >

                        <b>
                          Lead source:
                        </b>{" "}

                        {Object.entries(
                          leads.find(
                            (
                              lead
                            ) =>
                              lead.email
                                ?.toLowerCase() ===
                              email.email
                                .toLowerCase()
                          )?.source_data ||
                            {}
                        )
                          .map(
                            (
                              [
                                key,
                                value,
                              ]
                            ) =>
                              `${key}: ${value}`
                          )
                          .join(
                            " • "
                          )}

                      </div>

                    </div>

                  )
                )}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}