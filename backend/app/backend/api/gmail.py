from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.auth.gmail_oauth import (
    create_authorization_url,
    exchange_code,
    delete_credentials,
    is_connected,
)


router = APIRouter(
    prefix="/api/gmail",
    tags=["Gmail"],
)


FRONTEND_URL = "https://ritmailer.vercel.app"


@router.get("/connect")
async def connect_gmail():

    try:

        authorization_url, _ = create_authorization_url()

        return RedirectResponse(
            authorization_url
        )

    except Exception as error:

        print(
            "GMAIL CONNECT ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

@router.get("/callback")
async def gmail_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):

    print("")
    print("========================================")
    print("GMAIL CALLBACK RECEIVED")
    print("========================================")
    print("Code received:", bool(code))
    print("State received:", bool(state))
    print("Google error:", error)
    print("========================================")

    if error:

        return RedirectResponse(
            f"{FRONTEND_URL}/settings/gmail?"
            + urlencode(
                {
                    "status": "error",
                    "message": error,
                }
            )
        )

    if not code or not state:

        return RedirectResponse(
            f"{FRONTEND_URL}/settings/gmail?"
            + urlencode(
                {
                    "status": "error",
                    "message": "Missing OAuth response.",
                }
            )
        )

    try:

        authorization_response = (
            f"http://localhost:8000/api/gmail/callback?"
            f"code={code}&state={state}"
        )

        exchange_code(
            authorization_response=authorization_response,
            state=state,
        )

        print("GMAIL OAUTH SUCCESS")
        print("Redirecting to frontend...")

        return RedirectResponse(
            f"{FRONTEND_URL}/settings/gmail?"
            + urlencode(
                {
                    "status": "connected"
                }
            )
        )

    except Exception as error:

        print("")
        print("========================================")
        print("GMAIL OAUTH FAILED")
        print("========================================")
        print(repr(error))
        print("========================================")

        return RedirectResponse(
            f"{FRONTEND_URL}/settings/gmail?"
            + urlencode(
                {
                    "status": "error",
                    "message": str(error),
                }
            )
        )


@router.get("/status")
async def gmail_status():

    connected = is_connected()

    return {
        "connected": connected
    }



@router.post("/disconnect")
async def gmail_disconnect():

    delete_credentials()

    return {
        "success": True,
        "connected": False,
    }
