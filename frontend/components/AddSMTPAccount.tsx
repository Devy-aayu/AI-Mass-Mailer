<<<<<<< HEAD
"use client";

import {
  useState,
} from "react";

import {
  createSMTPAccount,
  SMTPAccountInput,
  testSMTPAccount,
} from "../lib/api";


type Props = {
  onConnected?: () => void;
};


export default function AddSMTPAccount({
  onConnected,
}: Props) {

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    host,
    setHost,
  ] = useState("");

  const [
    port,
    setPort,
  ] = useState(
    465
  );

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    security,
    setSecurity,
  ] = useState<
    "ssl" | "starttls"
  >("ssl");

  const [
    testing,
    setTesting,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  function applyZohoDefaults() {

    setHost(
      "smtppro.zoho.in"
    );

    setPort(
      465
    );

    setSecurity(
      "ssl"
    );

    if (!username && email) {

      setUsername(
        email
      );
    }

  }


  function buildPayload():
    SMTPAccountInput {

    return {
      email:
        email.trim(),

      display_name:
        displayName.trim(),

      host:
        host.trim(),

      port:
        Number(port),

      username:
        username.trim(),

      password,

      security,
    };
  }


  async function testConnection() {

    setError("");
    setMessage("");
    setTesting(true);


    try {

      await testSMTPAccount(
        buildPayload()
      );


      setMessage(
        "SMTP connection successful."
      );

    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "SMTP connection failed."
      );

    } finally {

      setTesting(
        false
      );

    }
  }


  async function connect() {

    setError("");
    setMessage("");
    setSaving(true);


    try {

      const result =
        await createSMTPAccount(
          buildPayload()
        );


      if (
        result.success
      ) {

        setMessage(
          "Email account connected successfully."
        );

        setPassword(
          ""
        );

        onConnected?.();
      }

    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "Could not connect SMTP account."
      );

    } finally {

      setSaving(
        false
      );

    }
  }


  return (

    <div
      style={{
        border:
          "1px solid #e5e5e5",
        borderRadius:
          14,
        padding:
          20,
        background:
          "#fff",
      }}
    >

      <div
        style={{
          marginBottom:
            18,
        }}
      >

        <h2
          style={{
            margin:
              0,
            fontSize:
              17,
            fontWeight:
              750,
          }}
        >
          Add SMTP Mailbox
        </h2>


        <p
          style={{
            marginTop:
              5,
            marginBottom:
              0,
            fontSize:
              12,
            color:
              "#777",
          }}
        >
          Use this for Zoho Mail or any custom
          email provider that supports SMTP.
        </p>

      </div>


      {/* QUICK ZOHO */}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={
          applyZohoDefaults
        }
        style={{
          marginBottom:
            18,
        }}
      >
        Use Zoho India SMTP defaults
      </button>


      {/* EMAIL */}

      <div className="field">

        <label className="field-label">
          Email address
        </label>

        <input
          className="input"
          type="email"
          value={
            email
          }
          onChange={(
            event
          ) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="sales@yourcompany.com"
        />

      </div>


      {/* DISPLAY NAME */}

      <div className="field">

        <label className="field-label">
          Display name
        </label>

        <input
          className="input"
          value={
            displayName
          }
          onChange={(
            event
          ) =>
            setDisplayName(
              event.target.value
            )
          }
          placeholder="Ritmailer Sales"
        />

      </div>


      {/* SMTP HOST */}

      <div className="field">

        <label className="field-label">
          SMTP host
        </label>

        <input
          className="input"
          value={
            host
          }
          onChange={(
            event
          ) =>
            setHost(
              event.target.value
            )
          }
          placeholder="smtppro.zoho.in"
        />

      </div>


      {/* PORT + SECURITY */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap:
            10,
        }}
      >

        <div className="field">

          <label className="field-label">
            Port
          </label>

          <input
            className="input"
            type="number"
            value={
              port
            }
            onChange={(
              event
            ) =>
              setPort(
                Number(
                  event.target.value
                )
              )
            }
          />

        </div>


        <div className="field">

          <label className="field-label">
            Security
          </label>

          <select
            className="input"
            value={
              security
            }
            onChange={(
              event
            ) =>
              setSecurity(
                event.target.value as
                  | "ssl"
                  | "starttls"
              )
            }
          >

            <option value="ssl">
              SSL
            </option>

            <option value="starttls">
              STARTTLS
            </option>

          </select>

        </div>

      </div>


      {/* USERNAME */}

      <div className="field">

        <label className="field-label">
          SMTP username
        </label>

        <input
          className="input"
          type="email"
          value={
            username
          }
          onChange={(
            event
          ) =>
            setUsername(
              event.target.value
            )
          }
          placeholder="Usually your email address"
        />

      </div>


      {/* PASSWORD */}

      <div className="field">

        <label className="field-label">
          App-specific password
        </label>

        <input
          className="input"
          type="password"
          value={
            password
          }
          onChange={(
            event
          ) =>
            setPassword(
              event.target.value
            )
          }
          placeholder="Paste your app password"
          autoComplete="new-password"
        />


        <div
          style={{
            marginTop:
              6,
            fontSize:
              10,
            color:
              "#888",
          }}
        >
          For Zoho with MFA, use the app-specific
          password rather than your normal account password.
        </div>

      </div>


      {/* STATUS */}

      {message && (

        <div
          style={{
            marginBottom:
              12,
            padding:
              11,
            borderRadius:
              8,
            background:
              "#ecfdf3",
            color:
              "#067647",
            fontSize:
              12,
          }}
        >
          {message}
        </div>

      )}


      {error && (

        <div
          style={{
            marginBottom:
              12,
            padding:
              11,
            borderRadius:
              8,
            background:
              "#fff0f0",
            color:
              "#b42318",
            fontSize:
              12,
            whiteSpace:
              "pre-wrap",
          }}
        >
          {error}
        </div>

      )}


      {/* BUTTONS */}

      <div
        style={{
          display:
            "flex",
          gap:
            10,
          flexWrap:
            "wrap",
        }}
      >

        <button
          type="button"
          className="btn btn-secondary"
          disabled={
            testing ||
            saving
          }
          onClick={
            testConnection
          }
        >
          {testing
            ? "Testing..."
            : "Test Connection"}
        </button>


        <button
          type="button"
          className="btn btn-primary"
          disabled={
            testing ||
            saving
          }
          onClick={
            connect
          }
        >
          {saving
            ? "Connecting..."
            : "Connect Mailbox"}
        </button>

      </div>

    </div>

  );
=======
"use client";

import {
  useState,
} from "react";

import {
  createSMTPAccount,
  SMTPAccountInput,
  testSMTPAccount,
} from "../lib/api";


type Props = {
  onConnected?: () => void;
};


export default function AddSMTPAccount({
  onConnected,
}: Props) {

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    host,
    setHost,
  ] = useState("");

  const [
    port,
    setPort,
  ] = useState(
    465
  );

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    security,
    setSecurity,
  ] = useState<
    "ssl" | "starttls"
  >("ssl");

  const [
    testing,
    setTesting,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  function applyZohoDefaults() {

    setHost(
      "smtppro.zoho.in"
    );

    setPort(
      465
    );

    setSecurity(
      "ssl"
    );

    if (!username && email) {

      setUsername(
        email
      );
    }

  }


  function buildPayload():
    SMTPAccountInput {

    return {
      email:
        email.trim(),

      display_name:
        displayName.trim(),

      host:
        host.trim(),

      port:
        Number(port),

      username:
        username.trim(),

      password,

      security,
    };
  }


  async function testConnection() {

    setError("");
    setMessage("");
    setTesting(true);


    try {

      await testSMTPAccount(
        buildPayload()
      );


      setMessage(
        "SMTP connection successful."
      );

    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "SMTP connection failed."
      );

    } finally {

      setTesting(
        false
      );

    }
  }


  async function connect() {

    setError("");
    setMessage("");
    setSaving(true);


    try {

      const result =
        await createSMTPAccount(
          buildPayload()
        );


      if (
        result.success
      ) {

        setMessage(
          "Email account connected successfully."
        );

        setPassword(
          ""
        );

        onConnected?.();
      }

    } catch (
      errorValue
    ) {

      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "Could not connect SMTP account."
      );

    } finally {

      setSaving(
        false
      );

    }
  }


  return (

    <div
      style={{
        border:
          "1px solid #e5e5e5",
        borderRadius:
          14,
        padding:
          20,
        background:
          "#fff",
      }}
    >

      <div
        style={{
          marginBottom:
            18,
        }}
      >

        <h2
          style={{
            margin:
              0,
            fontSize:
              17,
            fontWeight:
              750,
          }}
        >
          Add SMTP Mailbox
        </h2>


        <p
          style={{
            marginTop:
              5,
            marginBottom:
              0,
            fontSize:
              12,
            color:
              "#777",
          }}
        >
          Use this for Zoho Mail or any custom
          email provider that supports SMTP.
        </p>

      </div>


      {/* QUICK ZOHO */}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={
          applyZohoDefaults
        }
        style={{
          marginBottom:
            18,
        }}
      >
        Use Zoho India SMTP defaults
      </button>


      {/* EMAIL */}

      <div className="field">

        <label className="field-label">
          Email address
        </label>

        <input
          className="input"
          type="email"
          value={
            email
          }
          onChange={(
            event
          ) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="sales@yourcompany.com"
        />

      </div>


      {/* DISPLAY NAME */}

      <div className="field">

        <label className="field-label">
          Display name
        </label>

        <input
          className="input"
          value={
            displayName
          }
          onChange={(
            event
          ) =>
            setDisplayName(
              event.target.value
            )
          }
          placeholder="Ritmailer Sales"
        />

      </div>


      {/* SMTP HOST */}

      <div className="field">

        <label className="field-label">
          SMTP host
        </label>

        <input
          className="input"
          value={
            host
          }
          onChange={(
            event
          ) =>
            setHost(
              event.target.value
            )
          }
          placeholder="smtppro.zoho.in"
        />

      </div>


      {/* PORT + SECURITY */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap:
            10,
        }}
      >

        <div className="field">

          <label className="field-label">
            Port
          </label>

          <input
            className="input"
            type="number"
            value={
              port
            }
            onChange={(
              event
            ) =>
              setPort(
                Number(
                  event.target.value
                )
              )
            }
          />

        </div>


        <div className="field">

          <label className="field-label">
            Security
          </label>

          <select
            className="input"
            value={
              security
            }
            onChange={(
              event
            ) =>
              setSecurity(
                event.target.value as
                  | "ssl"
                  | "starttls"
              )
            }
          >

            <option value="ssl">
              SSL
            </option>

            <option value="starttls">
              STARTTLS
            </option>

          </select>

        </div>

      </div>


      {/* USERNAME */}

      <div className="field">

        <label className="field-label">
          SMTP username
        </label>

        <input
          className="input"
          type="email"
          value={
            username
          }
          onChange={(
            event
          ) =>
            setUsername(
              event.target.value
            )
          }
          placeholder="Usually your email address"
        />

      </div>


      {/* PASSWORD */}

      <div className="field">

        <label className="field-label">
          App-specific password
        </label>

        <input
          className="input"
          type="password"
          value={
            password
          }
          onChange={(
            event
          ) =>
            setPassword(
              event.target.value
            )
          }
          placeholder="Paste your app password"
          autoComplete="new-password"
        />


        <div
          style={{
            marginTop:
              6,
            fontSize:
              10,
            color:
              "#888",
          }}
        >
          For Zoho with MFA, use the app-specific
          password rather than your normal account password.
        </div>

      </div>


      {/* STATUS */}

      {message && (

        <div
          style={{
            marginBottom:
              12,
            padding:
              11,
            borderRadius:
              8,
            background:
              "#ecfdf3",
            color:
              "#067647",
            fontSize:
              12,
          }}
        >
          {message}
        </div>

      )}


      {error && (

        <div
          style={{
            marginBottom:
              12,
            padding:
              11,
            borderRadius:
              8,
            background:
              "#fff0f0",
            color:
              "#b42318",
            fontSize:
              12,
            whiteSpace:
              "pre-wrap",
          }}
        >
          {error}
        </div>

      )}


      {/* BUTTONS */}

      <div
        style={{
          display:
            "flex",
          gap:
            10,
          flexWrap:
            "wrap",
        }}
      >

        <button
          type="button"
          className="btn btn-secondary"
          disabled={
            testing ||
            saving
          }
          onClick={
            testConnection
          }
        >
          {testing
            ? "Testing..."
            : "Test Connection"}
        </button>


        <button
          type="button"
          className="btn btn-primary"
          disabled={
            testing ||
            saving
          }
          onClick={
            connect
          }
        >
          {saving
            ? "Connecting..."
            : "Connect Mailbox"}
        </button>

      </div>

    </div>

  );
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
}