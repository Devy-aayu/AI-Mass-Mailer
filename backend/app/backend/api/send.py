from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from app.services.gmail_service import send_email


router = APIRouter(
    prefix="/api",
    tags=["Email"],
)


class Recipient(BaseModel):
    name: str = ""
    email: str = Field(min_length=1)


class SendRequest(BaseModel):
    recipients: List[Recipient]
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)


@router.post("/send")
async def send_campaign(request: SendRequest):

    # ---------------------------------------------
    # VALIDATE SUBJECT
    # ---------------------------------------------

    subject = request.subject.strip()

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Email subject cannot be empty.",
        )

    # ---------------------------------------------
    # VALIDATE BODY
    # ---------------------------------------------

    email_body = request.body.strip()

    if not email_body:
        raise HTTPException(
            status_code=400,
            detail="Email message cannot be empty.",
        )

    # ---------------------------------------------
    # VALIDATE RECIPIENTS
    # ---------------------------------------------

    if not request.recipients:
        raise HTTPException(
            status_code=400,
            detail="No recipients were provided.",
        )

    sent = 0
    failed = 0

    results = []

    # ---------------------------------------------
    # SEND EMAILS
    # ---------------------------------------------

    for recipient in request.recipients:

        name = recipient.name.strip()
        email = recipient.email.strip().lower()

        if not email or "@" not in email:

            failed += 1

            results.append({
                "name": name,
                "email": email,
                "status": "failed",
                "error": "Invalid email address.",
            })

            continue

        # -----------------------------------------
        # PERSONALIZE MESSAGE
        # -----------------------------------------

        personalized_body = email_body.replace(
            "{{name}}",
            name or "there"
        )

        try:

            result = send_email(
                recipient=email,
                subject=subject,
                body=personalized_body,
            )

            if result.get("success"):

                sent += 1

                results.append({
                    "name": name,
                    "email": email,
                    "status": "sent",
                    "message_id": result.get("message_id"),
                })

            else:

                failed += 1

                results.append({
                    "name": name,
                    "email": email,
                    "status": "failed",
                    "error": result.get(
                        "error",
                        "Gmail failed to send the email."
                    ),
                })

        except Exception as exc:

            failed += 1

            results.append({
                "name": name,
                "email": email,
                "status": "failed",
                "error": str(exc),
            })

    # ---------------------------------------------
    # RETURN RESULT
    # ---------------------------------------------

    return {
        "success": failed == 0,
        "total": len(request.recipients),
        "sent": sent,
        "failed": failed,
        "results": results,
    }