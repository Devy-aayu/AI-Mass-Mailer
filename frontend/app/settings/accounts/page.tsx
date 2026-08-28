"use client";

import {
  useEffect,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  disconnectEmailAccount,
  EmailAccount,
  getConnectUrl,
  getEmailAccounts,
} from "../../../lib/api";

import AddSMTPAccount from "../../../components/AddSMTPAccount";






export default function AccountsPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const [onboarding, setOnboarding] = useState(false);

  const [
    accounts,
    setAccounts,
  ] = useState<EmailAccount[]>(
    []
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    showSMTP,
    setShowSMTP,
  ] = useState(false);


  



  async function load() {

    setError("");
    setSuccessMessage("");


    try {

      setLoading(
        true
      );


      const data =
        await getEmailAccounts();


      setAccounts(
        data.accounts
      );


    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "Could not load accounts."
      );


    } finally {

      setLoading(
        false
      );

    }
  }


  



  useEffect(
    () => {

      const onboardingFromQuery = searchParams.get("onboarding") === "1";
      const onboardingFromSession = sessionStorage.getItem("ritmailer_onboarding") === "1" || sessionStorage.getItem("ritnavOnboarding") === "1";
      setOnboarding(onboardingFromQuery || onboardingFromSession);

      const status = searchParams.get("status");
      const email = searchParams.get("email");
      const message = searchParams.get("message");

      if (status === "connected") {
        setSuccessMessage(
          email
            ? `${email} connected successfully.`
            : "Email account connected successfully."
        );
        window.history.replaceState({}, "", onboarding ? "/settings/accounts?onboarding=1" : "/settings/accounts");
      } else if (status === "error" && message) {
        setError(message);
        window.history.replaceState({}, "", onboarding ? "/settings/accounts?onboarding=1" : "/settings/accounts");
      }

      load();

    },
    [onboarding, searchParams]
  );


  



  async function disconnect(
    account: EmailAccount
  ) {

    const confirmed =
      window.confirm(
        `Disconnect ${account.email}?`
      );


    if (!confirmed) {
      return;
    }


    setError("");


    try {

      await disconnectEmailAccount(
        account.id
      );


      await load();


    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "Could not disconnect account."
      );

    }
  }


  



  function handleSMTPConnected() {

    setShowSMTP(
      false
    );


    load();

  }


  



  const gmailAccounts =
    accounts.filter(
      (
        account
      ) =>
        account.provider ===
        "gmail"
    );


  const outlookAccounts =
    accounts.filter(
      (
        account
      ) =>
        account.provider ===
        "outlook"
    );


  const smtpAccounts =
    accounts.filter(
      (
        account
      ) =>
        account.provider ===
        "smtp"
        ||
        account.provider ===
        "zoho"
    );


  



  return (

    <div
      style={{
        maxWidth:
          900,
        margin:
          "0 auto",
        padding:
          "40px 24px 80px",
      }}
    >

      {

}

      <div
        style={{
          marginBottom:
            28,
        }}
      >

        <h1
          style={{
            fontSize:
              28,
            fontWeight:
              800,
            margin:
              0,
            marginBottom:
              8,
          }}
        >
          Email Accounts
        </h1>


        <p
          style={{
            color:
              "#777",
            fontSize:
              14,
            margin:
              0,
            lineHeight:
              1.6,
            maxWidth:
              680,
          }}
        >
          Connect the mailboxes you want to use
          for sending campaigns. You can choose the
          sending mailbox before each campaign.
        </p>

      </div>


      {

}

      {error && (

        <div
          style={{
            marginBottom:
              18,
            padding:
              13,
            borderRadius:
              9,
            background:
              "#fff0f0",
            color:
              "#b42318",
            fontSize:
              13,
            lineHeight:
              1.5,
            whiteSpace:
              "pre-wrap",
          }}
        >

          {error}

        </div>

      )}


      {successMessage && (
        <div
          style={{
            marginBottom: 18,
            padding: 13,
            borderRadius: 9,
            background: "#effaf2",
            color: "#18794e",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {successMessage}
        </div>
      )}

      {onboarding && (
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 14,
            border: "1px solid #e5e5e5",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            Step 1 of 2 · Connect a sending account
          </div>
          <div style={{ color: "#777", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            You need at least one mailbox before creating campaigns. AI is optional and can be configured next.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn_primary"
              disabled={loading || accounts.length === 0}
              onClick={() => { sessionStorage.removeItem("ritmailer_onboarding"); sessionStorage.removeItem("ritnavOnboarding"); router.push("/settings/ai?onboarding=1"); }}
            >
              Continue to AI Setup Next
            </button>
            <button
              type="button"
              className="btn btn_secondary"
              onClick={() => { sessionStorage.removeItem("ritmailer_onboarding"); sessionStorage.removeItem("ritnavOnboarding"); router.push("/"); }}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}

      {

}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap:
            10,
          marginBottom:
            20,
        }}
      >

        <SummaryCard
          label="Total accounts"
          value={
            accounts.length
          }
        />


        <SummaryCard
          label="Gmail"
          value={
            gmailAccounts.length
          }
        />


        <SummaryCard
          label="Outlook"
          value={
            outlookAccounts.length
          }
        />


        <SummaryCard
          label="SMTP / Zoho"
          value={
            smtpAccounts.length
          }
        />

      </div>


      {

}

      <div
        style={{
          border:
            "1px solid #e5e5e5",
          borderRadius:
            14,
          background:
            "#fff",
          overflow:
            "hidden",
        }}
      >

        <div
          style={{
            padding:
              "18px 18px 15px",
            borderBottom:
              "1px solid #eeeeee",
          }}
        >

          <h2
            style={{
              margin:
                0,
              fontSize:
                16,
              fontWeight:
                750,
            }}
          >
            Connected accounts
          </h2>


          <p
            style={{
              margin:
                "5px 0 0",
              fontSize:
                11,
              color:
                "#888",
            }}
          >
            These mailboxes are available in the
            campaign sending selector.
          </p>

        </div>


        {loading ? (

          <div
            style={{
              padding:
                24,
              textAlign:
                "center",
              fontSize:
                13,
              color:
                "#777",
            }}
          >
            Loading accounts...
          </div>

        ) : accounts.length === 0 ? (

          <div
            style={{
              padding:
                28,
              textAlign:
                "center",
            }}
          >

            <div
              style={{
                fontSize:
                  28,
                marginBottom:
                  8,
              }}
            >
              Mail
            </div>


            <div
              style={{
                fontSize:
                  14,
                fontWeight:
                  700,
              }}
            >
              No email accounts connected
            </div>


            <div
              style={{
                marginTop:
                  5,
                fontSize:
                  11,
                color:
                  "#888",
              }}
            >
              Connect a mailbox below to start
              sending campaigns.
            </div>

          </div>

        ) : (

          <div>

            {accounts.map(
              (
                account,
                index
              ) => (

                <AccountRow
                  key={
                    account.id
                  }

                  account={
                    account
                  }

                  isLast={
                    index ===
                    accounts.length - 1
                  }

                  onDisconnect={
                    disconnect
                  }
                />

              )
            )}

          </div>

        )}

      </div>


      {

}

      <div
        style={{
          marginTop:
            20,
          border:
            "1px solid #e5e5e5",
          borderRadius:
            14,
          background:
            "#fff",
          padding:
            18,
        }}
      >

        <div
          style={{
            marginBottom:
              16,
          }}
        >

          <h2
            style={{
              margin:
                0,
              fontSize:
                16,
              fontWeight:
                750,
            }}
          >
            Add email account
          </h2>


          <p
            style={{
              margin:
                "5px 0 0",
              fontSize:
                11,
              color:
                "#888",
              lineHeight:
                1.5,
            }}
          >
            Connect Gmail or Outlook with OAuth, or use
            SMTP for Zoho Mail and custom-domain mailboxes.
          </p>

        </div>


        {

}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap:
              10,
            marginBottom:
              14,
          }}
        >

          <ProviderButton
            icon="G"
            title="Connect Gmail"
            description="Google OAuth"
            onboarding={onboarding}
            href={
              getConnectUrl(
                "gmail"
              )
            }
          />


          <ProviderButton
            icon="O"
            title="Connect Outlook"
            description="Microsoft OAuth"
            onboarding={onboarding}
            href={
              getConnectUrl(
                "outlook"
              )
            }
          />


          {


}

          <button
            type="button"
            className="btn btn_secondary"
            onClick={() =>
              setShowSMTP(
                !showSMTP
              )
            }
            style={{
              minHeight:
                62,
              textAlign:
                "left",
              padding:
                "11px 13px",
            }}
          >

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  10,
              }}
            >

              <span
                style={{
                  width:
                    32,
                  height:
                    32,
                  borderRadius:
                    9,
                  background:
                    "#f2f2f2",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontWeight:
                    800,
                  fontSize:
                    13,
                  flexShrink:
                    0,
                }}
              >
                Z
              </span>


              <span>

                <span
                  style={{
                    display:
                      "block",
                    fontSize:
                      12,
                    fontWeight:
                      700,
                  }}
                >
                  {showSMTP
                    ? "Close SMTP setup"
                    : "Connect Zoho / SMTP"}
                </span>


                <span
                  style={{
                    display:
                      "block",
                    marginTop:
                      2,
                    fontSize:
                      10,
                    color:
                      "#888",
                  }}
                >
                  App password / SMTP
                </span>

              </span>

            </div>

          </button>

        </div>


        {

}

        {showSMTP && (

          <div
            style={{
              marginTop:
                16,
              paddingTop:
                18,
              borderTop:
                "1px solid #eeeeee",
            }}
          >

            <AddSMTPAccount
              onConnected={
                handleSMTPConnected
              }
            />

          </div>

        )}

      </div>


      {

}

      <div
        style={{
          marginTop:
            16,
          padding:
            13,
          borderRadius:
            10,
          background:
            "#fafafa",
          border:
            "1px solid #eeeeee",
          fontSize:
            10,
          color:
            "#777",
          lineHeight:
            1.55,
        }}
      >

        <strong
          style={{
            color:
              "#555",
          }}
        >
          Security:
        </strong>{" "}
        OAuth accounts use provider authorization.
        SMTP credentials are submitted to the backend
        and stored encrypted; they are never placed in
        browser session storage.

      </div>

    </div>
  );
}






function AccountRow({
  account,
  isLast,
  onDisconnect,
}: {
  account: EmailAccount;
  isLast: boolean;
  onDisconnect: (
    account: EmailAccount
  ) => void;
}) {

  const provider =
    providerDetails(
      account.provider
    );


  return (

    <div
      style={{
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "space-between",
        gap:
          16,
        padding:
          "16px 18px",
        borderBottom:
          isLast
            ? "none"
            : "1px solid #eeeeee",
      }}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            12,
          minWidth:
            0,
        }}
      >

        {}

        <div
          style={{
            width:
              40,
            height:
              40,
            flexShrink:
              0,
            borderRadius:
              10,
            background:
              "#f5f5f5",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize:
              15,
            fontWeight:
              800,
          }}
        >
          {
            provider.icon
          }
        </div>


        {}

        <div
          style={{
            minWidth:
              0,
          }}
        >

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                7,
              flexWrap:
                "wrap",
            }}
          >

            <span
              style={{
                fontSize:
                  13,
                fontWeight:
                  750,
              }}
            >
              {
                provider.label
              }
            </span>


            <span
              style={{
                padding:
                  "3px 7px",
                borderRadius:
                  999,
                background:
                  "#ecfdf3",
                color:
                  "#067647",
                fontSize:
                  9,
                fontWeight:
                  700,
              }}
            >
              Connected
            </span>

          </div>


          <div
            style={{
              marginTop:
                4,
              fontSize:
                12,
              color:
                "#555",
              overflow:
                "hidden",
              textOverflow:
                "ellipsis",
              whiteSpace:
                "nowrap",
            }}
          >
            {
              account.email
            }
          </div>


          {account.display_name &&
            account.display_name !==
              account.email && (

              <div
                style={{
                  marginTop:
                    2,
                  fontSize:
                    10,
                  color:
                    "#999",
                }}
              >
                {
                  account.display_name
                }
              </div>

            )}

        </div>

      </div>


      {}

      <button
        type="button"
        className="btn btn_secondary"
        onClick={() =>
          onDisconnect(
            account
          )
        }
        style={{
          flexShrink:
            0,
          fontSize:
            11,
        }}
      >
        Disconnect
      </button>

    </div>

  );
}






function ProviderButton({
  icon,
  title,
  description,
  href,
  onboarding = false,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  onboarding?: boolean;
}) {

  return (

    <a
      href={
        href
      }
      onClick={() => {
        if (onboarding) {
          sessionStorage.setItem("ritnavOnboarding", "1");
        }
      }}
      className="btn btn_secondary"
      style={{
        minHeight:
          62,
        padding:
          "11px 13px",
        textDecoration:
          "none",
        textAlign:
          "left",
      }}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            10,
        }}
      >

        <span
          style={{
            width:
              32,
            height:
              32,
            borderRadius:
              9,
            background:
              "#f2f2f2",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            fontSize:
              13,
            fontWeight:
              800,
            flexShrink:
              0,
          }}
        >
          {icon}
        </span>


        <span>

          <span
            style={{
              display:
                "block",
              fontSize:
                12,
              fontWeight:
                700,
            }}
          >
            {title}
          </span>


          <span
            style={{
              display:
                "block",
              marginTop:
                2,
              fontSize:
                10,
              color:
                "#888",
            }}
          >
            {description}
          </span>

        </span>

      </div>

    </a>

  );
}






function providerDetails(
  provider: string
) {

  switch (
    provider
  ) {

    case "gmail":

      return {
        label:
          "Gmail",
        icon:
          "G",
      };


    case "outlook":

      return {
        label:
          "Outlook / Microsoft",
        icon:
          "O",
      };


    case "zoho":

      return {
        label:
          "Zoho Mail",
        icon:
          "Z",
      };


    case "smtp":

      return {
        label:
          "SMTP Mailbox",
        icon:
          "Mail",
      };


    default:

      return {
        label:
          provider,
        icon:
          "Mail",
      };

  }
}






function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <div
      style={{
        border:
          "1px solid #e5e5e5",
        borderRadius:
          11,
        padding:
          13,
        background:
          "#fff",
      }}
    >

      <div
        style={{
          fontSize:
            10,
          color:
            "#888",
          fontWeight:
            600,
        }}
      >
        {label}
      </div>


      <div
        style={{
          marginTop:
            5,
          fontSize:
            20,
          fontWeight:
            800,
        }}
      >
        {value}
      </div>

    </div>

  );
}