from __future__ import annotations

import json
import time

try:
    import msal
except ImportError:                                        
    msal = None
import requests

from app.config import (
    MICROSOFT_AUTHORITY,
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    MICROSOFT_REDIRECT_URI,
    MICROSOFT_SCOPES,
)

from app.services.account_store import (
    update_tokens,
)


GRAPH_URL = (
    "https://graph.microsoft.com/v1.0"
)


class OutlookProvider:

    provider_name = "outlook"


    def __init__(self):
        pass


    @staticmethod
    def _msal_app(
        cache: msal.SerializableTokenCache | None = None,
    ):

        return (
            msal.ConfidentialClientApplication(
                MICROSOFT_CLIENT_ID,
                authority=
                    MICROSOFT_AUTHORITY,
                client_credential=
                    MICROSOFT_CLIENT_SECRET,
                token_cache=cache,
            )
        )


    def authorization_url(
        self,
        state: str,
    ) -> str:

        if not MICROSOFT_CLIENT_ID:
            raise RuntimeError(
                "MICROSOFT_CLIENT_ID is not configured."
            )

        if not MICROSOFT_CLIENT_SECRET:
            raise RuntimeError(
                "MICROSOFT_CLIENT_SECRET is not configured."
            )

        app = self._msal_app()

        return (
            app.get_authorization_request_url(
                scopes=MICROSOFT_SCOPES,
                state=state,
                redirect_uri=
                    MICROSOFT_REDIRECT_URI,
                prompt="select_account",
            )
        )


    def exchange_code(
        self,
        code: str,
    ) -> tuple[dict, dict]:

        cache = (
            msal.SerializableTokenCache()
        )

        app = self._msal_app(
            cache
        )

        result = (
            app.acquire_token_by_authorization_code(
                code,
                scopes=MICROSOFT_SCOPES,
                redirect_uri=
                    MICROSOFT_REDIRECT_URI,
            )
        )

        if "error" in result:

            raise RuntimeError(
                result.get(
                    "error_description",
                    result.get(
                        "error",
                        "Microsoft OAuth failed.",
                    ),
                )
            )

        access_token = result.get(
            "access_token"
        )

        if not access_token:

            raise RuntimeError(
                "Microsoft did not return an access token."
            )

        profile = requests.get(
            f"{GRAPH_URL}/me",
            headers={
                "Authorization":
                    f"Bearer {access_token}"
            },
            timeout=20,
        )

        if not profile.ok:

            raise RuntimeError(
                "Could not read Microsoft account profile: "
                + profile.text[:500]
            )

        profile_data = (
            profile.json()
        )

        cache_blob = cache.serialize()

        tokens = {
            "msal_cache":
                cache_blob,
        }

        expires_at = int(
            time.time()
            + int(
                result.get(
                    "expires_in",
                    3600,
                )
            )
        )

        account_info = {
            "email":
                profile_data.get(
                    "mail"
                )
                or profile_data.get(
                    "userPrincipalName"
                )
                or "",

            "display_name":
                profile_data.get(
                    "displayName"
                )
                or "",

            "provider_account_id":
                profile_data.get(
                    "id"
                )
                or "",
        }

        tokens[
            "profile"
        ] = profile_data

        return (
            {
                "tokens":
                    tokens,

                "expires_at":
                    expires_at,
            },

            account_info,
        )


    def _get_access_token(
        self,
        account: dict,
    ) -> str:

        token_data = (
            account["tokens"]
        )

        cache = (
            msal.SerializableTokenCache()
        )

        cache_blob = token_data.get(
            "msal_cache"
        )

        if not cache_blob:

            raise RuntimeError(
                "Microsoft token cache is missing."
            )

        cache.deserialize(
            cache_blob
        )

        app = self._msal_app(
            cache
        )

        accounts = (
            app.get_accounts()
        )

        if not accounts:

            raise RuntimeError(
                "Microsoft account authorization is no longer available."
            )

        result = (
            app.acquire_token_silent(
                MICROSOFT_SCOPES,
                account=accounts[0],
            )
        )

        if not result:

            raise RuntimeError(
                "Could not refresh the Microsoft access token. "
                "Please reconnect Outlook."
            )

        access_token = result.get(
            "access_token"
        )

        if not access_token:

            raise RuntimeError(
                "Microsoft did not provide an access token."
            )

                                      
        new_cache = cache.serialize()

        updated_tokens = {
            "msal_cache":
                new_cache,

            "profile":
                token_data.get(
                    "profile",
                    {},
                ),
        }

        update_tokens(
            account["id"],
            user_id=account["user_id"],
            tokens=updated_tokens,
            token_expires_at=int(
                time.time()
                + int(
                    result.get(
                        "expires_in",
                        3600,
                    )
                )
            ),
        )

        return access_token


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

        payload = {
            "message": {
                "subject":
                    subject,

                "body": {
                    "contentType":
                        "Text",

                    "content":
                        body,
                },

                "toRecipients": [
                    {
                        "emailAddress": {
                            "address":
                                recipient,
                        }
                    }
                ],
            },

            "saveToSentItems":
                True,
        }

        response = requests.post(
            f"{GRAPH_URL}/me/sendMail",
            headers={
                "Authorization":
                    f"Bearer {access_token}",

                "Content-Type":
                    "application/json",
            },
            json=payload,
            timeout=30,
        )

        if response.status_code == 202:

            return {
                "success": True,
                "message_id": None,
            }

        return {
            "success": False,
            "error":
                (
                    f"Microsoft Graph "
                    f"{response.status_code}: "
                    f"{response.text[:500]}"
                ),
        }