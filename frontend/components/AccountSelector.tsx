<<<<<<< HEAD
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  EmailAccount,
  EmailProvider,
  getConnectUrl,
  getEmailAccounts,
} from "../lib/api";

type ConnectProvider = Exclude<EmailProvider, "smtp">;


type Props = {
  onChange?: (
    accountId: string
  ) => void;
};


export default function AccountSelector({
  onChange,
}: Props) {

  const [
    accounts,
    setAccounts,
  ] = useState<EmailAccount[]>(
    []
  );


  const [
    selected,
    setSelected,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadAccounts =
    async () => {

      try {

        const data =
          await getEmailAccounts();


        setAccounts(
          data.accounts
        );


        const saved =
          sessionStorage.getItem(
            "ritnavSendingAccountId"
          );


        const first =
          saved ||
          data.accounts[0]?.id ||
          "";


        if (first) {

          setSelected(
            first
          );

          sessionStorage.setItem(
            "ritnavSendingAccountId",
            first
          );

          onChange?.(
            first
          );

        }

      } catch (
        error
      ) {

        console.error(
          "Could not load email accounts:",
          error
        );

      } finally {

        setLoading(
          false
        );

      }
    };


  useEffect(() => {

    loadAccounts();

  }, []);


  function handleChange(
    accountId: string
  ) {

    setSelected(
      accountId
    );


    sessionStorage.setItem(
      "ritnavSendingAccountId",
      accountId
    );


    onChange?.(
      accountId
    );

  }


  if (loading) {

    return (
      <div
        style={{
          padding: 12,
          border:
            "1px solid #e8e8e8",
          borderRadius: 10,
          fontSize: 12,
          color: "#777",
        }}
      >
        Loading sending accounts...
      </div>
    );

  }


  return (

    <div
      className="card"
      style={{
        marginBottom: 16,
      }}
    >

      <div className="card-body">

        <label
          className="field-label"
        >
          Sending account
        </label>


        {accounts.length > 0 ? (

          <>

            <select
              className="input"
              value={selected}
              onChange={(
                event
              ) =>
                handleChange(
                  event.target.value
                )
              }
            >

              {accounts.map(
                (
                  account
                ) => (

                  <option
                    key={
                      account.id
                    }
                    value={
                      account.id
                    }
                  >
                    {providerIcon(
                      account.provider
                    )}{" "}
                    {providerLabel(
                      account.provider
                    )} —{" "}
                    {account.email}
                  </option>

                )
              )}

            </select>


            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                color: "#777",
              }}
            >
              The campaign will be sent from the
              selected mailbox.
            </div>

          </>

        ) : (

          <div>

            <div
              style={{
                padding:
                  12,
                border:
                  "1px solid #f0dcae",
                background:
                  "#fffaf0",
                borderRadius:
                  9,
                fontSize:
                  12,
                color:
                  "#765d20",
              }}
            >
              No email account is connected.
            </div>


            <div
              style={{
                display:
                  "flex",
                gap:
                  8,
                flexWrap:
                  "wrap",
                marginTop:
                  10,
              }}
            >

              {(
                [
                  "gmail",
                  "outlook",
                  "zoho",
                ] satisfies ConnectProvider[]
              ).map(
                (
                  provider
                ) => (

                  <a
                    key={
                      provider
                    }
                    className="btn btn-secondary"
                    href={
                      getConnectUrl(
                        provider
                      )
                    }
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >
                    +{" "}
                    {
                      providerLabel(
                        provider
                      )
                    }
                  </a>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </div>

  );
}


function providerLabel(provider: EmailProvider) {
  if (provider === "gmail") {
    return "Gmail";
  }

  if (provider === "outlook") {
    return "Outlook / Microsoft";
  }

  if (provider === "zoho") {
    return "Zoho Mail";
  }

  return "SMTP Mailbox";
}


function providerIcon(provider: EmailProvider) {
  if (provider === "gmail") {
    return "G";
  }

  if (provider === "outlook") {
    return "O";
  }

  if (provider === "zoho") {
    return "Z";
  }

  return "✉";
=======
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  EmailAccount,
  EmailProvider,
  getConnectUrl,
  getEmailAccounts,
} from "../lib/api";

type ConnectProvider = Exclude<EmailProvider, "smtp">;


type Props = {
  onChange?: (
    accountId: string
  ) => void;
};


export default function AccountSelector({
  onChange,
}: Props) {

  const [
    accounts,
    setAccounts,
  ] = useState<EmailAccount[]>(
    []
  );


  const [
    selected,
    setSelected,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadAccounts =
    async () => {

      try {

        const data =
          await getEmailAccounts();


        setAccounts(
          data.accounts
        );


        const saved =
          sessionStorage.getItem(
            "ritnavSendingAccountId"
          );


        const first =
          saved ||
          data.accounts[0]?.id ||
          "";


        if (first) {

          setSelected(
            first
          );

          sessionStorage.setItem(
            "ritnavSendingAccountId",
            first
          );

          onChange?.(
            first
          );

        }

      } catch (
        error
      ) {

        console.error(
          "Could not load email accounts:",
          error
        );

      } finally {

        setLoading(
          false
        );

      }
    };


  useEffect(() => {

    loadAccounts();

  }, []);


  function handleChange(
    accountId: string
  ) {

    setSelected(
      accountId
    );


    sessionStorage.setItem(
      "ritnavSendingAccountId",
      accountId
    );


    onChange?.(
      accountId
    );

  }


  if (loading) {

    return (
      <div
        style={{
          padding: 12,
          border:
            "1px solid #e8e8e8",
          borderRadius: 10,
          fontSize: 12,
          color: "#777",
        }}
      >
        Loading sending accounts...
      </div>
    );

  }


  return (

    <div
      className="card"
      style={{
        marginBottom: 16,
      }}
    >

      <div className="card-body">

        <label
          className="field-label"
        >
          Sending account
        </label>


        {accounts.length > 0 ? (

          <>

            <select
              className="input"
              value={selected}
              onChange={(
                event
              ) =>
                handleChange(
                  event.target.value
                )
              }
            >

              {accounts.map(
                (
                  account
                ) => (

                  <option
                    key={
                      account.id
                    }
                    value={
                      account.id
                    }
                  >
                    {providerIcon(
                      account.provider
                    )}{" "}
                    {providerLabel(
                      account.provider
                    )} —{" "}
                    {account.email}
                  </option>

                )
              )}

            </select>


            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                color: "#777",
              }}
            >
              The campaign will be sent from the
              selected mailbox.
            </div>

          </>

        ) : (

          <div>

            <div
              style={{
                padding:
                  12,
                border:
                  "1px solid #f0dcae",
                background:
                  "#fffaf0",
                borderRadius:
                  9,
                fontSize:
                  12,
                color:
                  "#765d20",
              }}
            >
              No email account is connected.
            </div>


            <div
              style={{
                display:
                  "flex",
                gap:
                  8,
                flexWrap:
                  "wrap",
                marginTop:
                  10,
              }}
            >

              {(
                [
                  "gmail",
                  "outlook",
                  "zoho",
                ] satisfies ConnectProvider[]
              ).map(
                (
                  provider
                ) => (

                  <a
                    key={
                      provider
                    }
                    className="btn btn-secondary"
                    href={
                      getConnectUrl(
                        provider
                      )
                    }
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >
                    +{" "}
                    {
                      providerLabel(
                        provider
                      )
                    }
                  </a>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </div>

  );
}


function providerLabel(provider: EmailProvider) {
  if (provider === "gmail") {
    return "Gmail";
  }

  if (provider === "outlook") {
    return "Outlook / Microsoft";
  }

  if (provider === "zoho") {
    return "Zoho Mail";
  }

  return "SMTP Mailbox";
}


function providerIcon(provider: EmailProvider) {
  if (provider === "gmail") {
    return "G";
  }

  if (provider === "outlook") {
    return "O";
  }

  if (provider === "zoho") {
    return "Z";
  }

  return "✉";
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
}