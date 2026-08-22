from __future__ import annotations

from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from app.auth.dependencies import get_current_user
from app.services.account_service import get_send_account

from app.services.campaign_store import get_campaign, update_campaign, update_lead_delivery

from app.services.provider_service import (
    get_provider,
)


router = APIRouter(
    prefix="/api",
    tags=["Email"],
)


class Recipient(BaseModel):

    name: str = ""

    email: str = Field(
        min_length=1
    )


class PersonalizedEmail(BaseModel):

    name: str = ""

    email: str = Field(
        min_length=1
    )

    subject: str = Field(
        min_length=1
    )

    body: str = Field(
        min_length=1
    )

    phone: str = ""

    company: str = ""


class SendRequest(BaseModel):

    # NEW:
    # Which connected account should send the campaign?
    account_id: Optional[str] = None
    campaign_id: Optional[str] = None


    recipients: List[
        Recipient
    ] = []


    subject: Optional[str] = None


    body: Optional[str] = None


    personalized_emails: List[
        PersonalizedEmail
    ] = []


def valid_email(
    email: str,
) -> bool:

    email = (
        email
        .strip()
        .lower()
    )

    if not email:
        return False

    if " " in email:
        return False

    if email.count("@") != 1:
        return False

    local, domain = (
        email.split("@")
    )

    if not local:
        return False

    if not domain:
        return False

    if "." not in domain:
        return False

    return True


@router.post("/send")
async def send_campaign(
    request: SendRequest,
    user: dict = Depends(get_current_user),
):

    # =========================================================
    # ACCOUNT
    # =========================================================

    account_id = (request.account_id or "").strip()
    if not account_id:
        raise HTTPException(status_code=400, detail="Select a connected sending account.")


    try:

        account = get_send_account(
            account_id,
            user["id"],
        )

        provider = get_provider(
            account["provider"]
        )

        if request.campaign_id:
            campaign = get_campaign(request.campaign_id, user_id=user["id"])
            if not campaign:
                raise RuntimeError("Campaign was not found for the current user.")
            if campaign.get("account_id") and campaign["account_id"] != account_id:
                raise RuntimeError("The selected sender does not match this campaign.")

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


    if request.campaign_id:
        update_campaign(request.campaign_id, user_id=user["id"], account_id=account_id, status="sending", started_at=__import__("time").time())

    # =========================================================
    # AI PERSONALIZED MODE
    # =========================================================

    if request.personalized_emails:

        sent = 0
        failed = 0

        results = []


        for item in (
            request.personalized_emails
        ):

            email = (
                item.email
                .strip()
                .lower()
            )

            subject = (
                item.subject
                .strip()
            )

            body = (
                item.body
                .strip()
            )

            name = (
                item.name
                .strip()
            )


            if not valid_email(
                email
            ):

                failed += 1

                results.append(
                    {
                        "name":
                            name,

                        "email":
                            email,

                        "status":
                            "failed",

                        "error":
                            "Invalid email address.",
                    }
                )

                continue


            if not subject:

                failed += 1

                results.append(
                    {
                        "name":
                            name,

                        "email":
                            email,

                        "status":
                            "failed",

                        "error":
                            "Email subject is empty.",
                    }
                )

                continue


            if not body:

                failed += 1

                results.append(
                    {
                        "name":
                            name,

                        "email":
                            email,

                        "status":
                            "failed",

                        "error":
                            "Email body is empty.",
                    }
                )

                continue


            try:

                send_result = (
                    provider.send(
                        account=account,
                        recipient=email,
                        subject=subject,
                        body=body,
                    )
                )


                if send_result.get(
                    "success"
                ):

                    sent += 1

                    message_id = send_result.get("message_id") or ""
                    if request.campaign_id:
                        update_lead_delivery(
                            request.campaign_id, email, status="sent",
                            subject=subject, body=body, message_id=message_id,
                            sent_from=account.get("email", ""),
                        )
                    results.append(
                        {
                            "name": name,
                            "email": email,
                            "status": "sent",
                            "message_id": message_id,
                        }
                    )

                else:

                    failed += 1
                    failure = send_result.get("error", "Provider failed to send the email.")
                    if request.campaign_id:
                        update_lead_delivery(
                            request.campaign_id, email, status="failed",
                            error=failure, subject=subject, body=body,
                            sent_from=account.get("email", ""),
                        )
                    results.append(
                        {"name": name, "email": email, "status": "failed", "error": failure}
                    )


            except Exception as exc:

                failed += 1
                failure = str(exc)
                if request.campaign_id:
                    update_lead_delivery(
                        request.campaign_id, email, status="failed",
                        error=failure, subject=subject, body=body,
                        sent_from=account.get("email", ""),
                    )
                results.append(
                    {"name": name, "email": email, "status": "failed", "error": failure}
                )


        if request.campaign_id:
            update_campaign(request.campaign_id, user_id=user["id"], account_id=account_id, status="completed", sent_count=sent, failed_count=failed, total_recipients=len(request.personalized_emails), completed_at=__import__("time").time())

        return {
            "success":
                failed == 0,

            "mode":
                "ai_personalized",

            "provider":
                account["provider"],

            "account_id":
                account_id,

            "total":
                len(
                    request.personalized_emails
                ),

            "sent":
                sent,

            "failed":
                failed,

            "results":
                results,
        }


    # =========================================================
    # STANDARD MODE
    # =========================================================

    subject = (
        request.subject
        or ""
    ).strip()

    body = (
        request.body
        or ""
    ).strip()


    if not subject:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email subject cannot be empty."
            ),
        )


    if not body:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email message cannot be empty."
            ),
        )


    if not request.recipients:

        raise HTTPException(
            status_code=400,
            detail=(
                "No recipients were provided."
            ),
        )


    sent = 0
    failed = 0
    results = []


    for recipient in (
        request.recipients
    ):

        email = (
            recipient.email
            .strip()
            .lower()
        )

        name = (
            recipient.name
            .strip()
        )


        if not valid_email(
            email
        ):

            failed += 1

            results.append(
                {
                    "name":
                        name,

                    "email":
                        email,

                    "status":
                        "failed",

                    "error":
                        "Invalid email address.",
                }
            )

            continue


        personalized_body = (
            body.replace(
                "{{name}}",
                name or "there",
            )
        )


        try:

            send_result = (
                provider.send(
                    account=account,
                    recipient=email,
                    subject=subject,
                    body=personalized_body,
                )
            )


            if send_result.get(
                "success"
            ):

                sent += 1

                message_id = send_result.get("message_id") or ""
                if request.campaign_id:
                    update_lead_delivery(
                        request.campaign_id, email, status="sent",
                        subject=subject, body=personalized_body, message_id=message_id,
                        sent_from=account.get("email", ""),
                    )
                results.append(
                    {"name": name, "email": email, "status": "sent", "message_id": message_id}
                )

            else:

                failed += 1

                failure = send_result.get("error", "Provider failed to send the email.")
                if request.campaign_id:
                    update_lead_delivery(
                        request.campaign_id, email, status="failed",
                        error=failure, subject=subject, body=personalized_body,
                        sent_from=account.get("email", ""),
                    )
                results.append(
                    {"name": name, "email": email, "status": "failed", "error": failure}
                )


        except Exception as exc:

            failed += 1
            failure = str(exc)
            if request.campaign_id:
                update_lead_delivery(
                    request.campaign_id, email, status="failed",
                    error=failure, subject=subject, body=personalized_body,
                    sent_from=account.get("email", ""),
                )
            results.append(
                {"name": name, "email": email, "status": "failed", "error": failure}
            )


    if request.campaign_id:
        update_campaign(request.campaign_id, user_id=user["id"], account_id=account_id, status="completed", sent_count=sent, failed_count=failed, total_recipients=len(request.recipients), completed_at=__import__("time").time())

    return {
        "success":
            failed == 0,

        "mode":
            "standard",

        "provider":
            account["provider"],

        "account_id":
            account_id,

        "total":
            len(
                request.recipients
            ),

        "sent":
            sent,

        "failed":
            failed,

        "results":
            results,
    }