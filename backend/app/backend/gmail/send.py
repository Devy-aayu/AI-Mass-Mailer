<<<<<<< HEAD
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
import time

from app.gmail.sender import send_email
from app.gmail.client import create_gmail_service

router = APIRouter(
    prefix="/api/send",
    tags=["Send"]
)

gmail_service = None
sender_email = None


class SendRequest(BaseModel):
    subject: str = Field(min_length=1)
    message: str = Field(min_length=1)
    recipients: List[str]


@router.post("")
async def send_campaign(request: SendRequest):

    global gmail_service
    global sender_email

    if gmail_service is None:
        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected."
        )

    if not request.recipients:
        raise HTTPException(
            status_code=400,
            detail="No recipients."
        )

    results = []

    for email in request.recipients:

        try:

            result = send_email(
                gmail_service=gmail_service,
                sender=sender_email,
                recipient=email,
                subject=request.subject,
                body=request.message,
            )

            results.append({
                "email": email,
                "status": "sent",
                "message_id": result.get("id"),
            })

        except Exception as error:

            results.append({
                "email": email,
                "status": "failed",
                "error": str(error),
            })

        # Small delay between requests.
        time.sleep(0.2)

    successful = sum(
        1 for result in results
        if result["status"] == "sent"
    )

    failed = len(results) - successful

    return {
        "success": True,
        "total": len(results),
        "sent": successful,
        "failed": failed,
        "results": results,
=======
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
import time

from app.gmail.sender import send_email
from app.gmail.client import create_gmail_service

router = APIRouter(
    prefix="/api/send",
    tags=["Send"]
)

gmail_service = None
sender_email = None


class SendRequest(BaseModel):
    subject: str = Field(min_length=1)
    message: str = Field(min_length=1)
    recipients: List[str]


@router.post("")
async def send_campaign(request: SendRequest):

    global gmail_service
    global sender_email

    if gmail_service is None:
        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected."
        )

    if not request.recipients:
        raise HTTPException(
            status_code=400,
            detail="No recipients."
        )

    results = []

    for email in request.recipients:

        try:

            result = send_email(
                gmail_service=gmail_service,
                sender=sender_email,
                recipient=email,
                subject=request.subject,
                body=request.message,
            )

            results.append({
                "email": email,
                "status": "sent",
                "message_id": result.get("id"),
            })

        except Exception as error:

            results.append({
                "email": email,
                "status": "failed",
                "error": str(error),
            })

        # Small delay between requests.
        time.sleep(0.2)

    successful = sum(
        1 for result in results
        if result["status"] == "sent"
    )

    failed = len(results) - successful

    return {
        "success": True,
        "total": len(results),
        "sent": successful,
        "failed": failed,
        "results": results,
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    }