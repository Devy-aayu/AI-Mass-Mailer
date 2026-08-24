from __future__ import annotations

import time
from urllib.parse import urlencode

import requests

from app.config import (
    ZOHO_ACCOUNTS_URL,
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_MAIL_URL,
    ZOHO_REDIRECT_URI,
    ZOHO_SCOPES,
)

from app.services.account_store import (
    update_tokens,
)


class ZohoProvider:

    provider_name = "zoho"


    def authorization_url(
        self,
        state: str,
    ) -> str:

        if not ZOHO_CLIENT_ID:
            raise RuntimeError(
                "ZOHO_CLIENT_ID is not configured."
            )

        params = {
            "client_id":
                ZOHO_CLIENT_ID,

            "response_type":
                "code",

            "redirect_uri":
                ZOHO_REDIRECT_URI,

            "scope":
                ZOHO_SCOPES,

            "access_type":
                "offline",

            "state":
                state,
        }

        return (
            f"{ZOHO_ACCOUNTS_URL}"
            "/oauth/v2/auth?"
            f"{urlencode(params)}"
        )


    def exchange_code(
        self,
        code: str,
    ) -> tuple[dict, dict]:

        response = requests.post(
            f"{ZOHO_ACCOUNTS_URL}/oauth/v2/token",
            params={
                "code":
                    code,

                "grant_type":
                    "authorization_code",

                "client_id":
                    ZOHO_CLIENT_ID,

                "client_secret":
                    ZOHO_CLIENT_SECRET,

                "redirect_uri":
                    ZOHO_REDIRECT_URI,
            },
            timeout=30,
        )

        if not response.ok:

            raise RuntimeError(
                "Zoho token exchange failed: "
                + response.text[:500]
            )

        data = response.json()

        access_token = (
            data.get(
                "access_token"
            )
        )

        refresh_token = (
            data.get(
                "refresh_token"
            )
        )

        if not access_token:

            raise RuntimeError(
                "Zoho did not return an access token."
            )

        if not refresh_token:

            raise RuntimeError(
                "Zoho did not return a refresh token. "
                "Make sure access_type=offline is enabled."
            )

        account_data = (
            self._get_account_list(
                access_token
            )
        )

        accounts = (
            account_data.get(
                "data",
                []
            )
        )

        if not accounts:

            raise RuntimeError(
                "Zoho did not return any mail accounts."
            )

        first = accounts[0]

        expires_in = int(
            data.get(
                "expires_in",
                3600,
            )
        )

        tokens = {
            "access_token":
                access_token,

            "refresh_token":
                refresh_token,
        }

        account_info = {
            "email":
                first.get(
                    "emailAddress"
                )
                or first.get(
                    "mailAccount"
                )
                or "",

            "display_name":
                first.get(
                    "displayName"
                )
                or "",

            "provider_account_id":
                str(
                    first.get(
                        "accountId"
                    )
                    or first.get(
                        "account_id"
                    )
                    or ""
                ),
        }

        return (
            {
                "tokens":
                    tokens,

                "expires_at":
                    int(
                        time.time()
                        + expires_in
                    ),
            },

            account_info,
        )


    def _refresh_token(
        self,
        account: dict,
    ) -> str:

        tokens = (
            account["tokens"]
        )

        refresh_token = (
            tokens.get(
                "refresh_token"
            )
        )

        if not refresh_token:

            raise RuntimeError(
                "Zoho refresh token is missing."
            )

        response = requests.post(
            f"{ZOHO_ACCOUNTS_URL}/oauth/v2/token",
            params={
                "refresh_token":
                    refresh_token,

                "grant_type":
                    "refresh_token",

                "client_id":
                    ZOHO_CLIENT_ID,

                "client_secret":
                    ZOHO_CLIENT_SECRET,
            },
            timeout=30,
        )

        if not response.ok:

            raise RuntimeError(
                "Zoho token refresh failed: "
                + response.text[:500]
            )

        data = response.json()

        new_access_token = (
            data.get(
                "access_token"
            )
        )

        if not new_access_token:

            raise RuntimeError(
                "Zoho did not return a refreshed access token."
            )

        new_tokens = {
            "access_token":
                new_access_token,

            "refresh_token":
                refresh_token,
        }

        update_tokens(
            account["id"],
            user_id=account["user_id"],
            tokens=new_tokens,
            token_expires_at=int(
                time.time()
                + int(
                    data.get(
                        "expires_in",
                        3600,
                    )
                )
            ),
        )

        account["tokens"] = (
            new_tokens
        )

        return new_access_token


    def _get_access_token(
        self,
        account: dict,
    ) -> str:

        now = int(
            time.time()
        )

        expires_at = int(
            account.get(
                "token_expires_at",
                0,
            )
        )

        if (
            expires_at > now + 60
            and account["tokens"].get(
                "access_token"
            )
        ):

            return account["tokens"][
                "access_token"
            ]

        return self._refresh_token(
            account
        )


    def _get_account_list(
        self,
        access_token: str,
    ) -> dict:

        response = requests.get(
            f"{ZOHO_MAIL_URL}/api/accounts",
            headers={
                "Authorization":
                    f"Zoho-oauthtoken {access_token}",

                "Accept":
                    "application/json",
            },
            timeout=30,
        )

        if not response.ok:

            raise RuntimeError(
                "Could not retrieve Zoho mail accounts: "
                + response.text[:500]
            )

        return response.json()


    def send(
        self,
        *,
        account: dict,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        access_token = (
            self._get_access_token(
                account
            )
        )

        provider_account_id = (
            account.get(
                "provider_account_id"
            )
        )

        if not provider_account_id:

            raise RuntimeError(
                "Zoho account ID is missing."
            )

        from_address = (
            account.get(
                "email"
            )
        )

        payload = {
            "fromAddress":
                from_address,

            "toAddress":
                recipient,

            "subject":
                subject,

            "content":
                body,
        }

        response = requests.post(
            (
                f"{ZOHO_MAIL_URL}"
                f"/api/accounts/"
                f"{provider_account_id}"
                "/messages"
            ),

            headers={
                "Authorization":
                    f"Zoho-oauthtoken {access_token}",

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json",
            },

            json=payload,

            timeout=30,
        )

        if response.ok:

            return {
                "success": True,
                "message_id": None,
            }

        return {
            "success": False,
            "error":
                (
                    f"Zoho "
                    f"{response.status_code}: "
                    f"{response.text[:500]}"
                ),
        }