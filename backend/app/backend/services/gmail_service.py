import base64
from email.message import EmailMessage

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.auth.gmail_oauth import load_credentials


def get_gmail_service():

    credentials = load_credentials()

    if not credentials:
        raise RuntimeError(
            "Gmail account is not connected."
        )

    return build(
        "gmail",
        "v1",
        credentials=credentials,
        cache_discovery=False,
    )


def send_email(
    recipient: str,
    subject: str,
    body: str,
):

    service = get_gmail_service()

    message = EmailMessage()

    message["To"] = recipient
    message["Subject"] = subject

    message.set_content(body)

    encoded_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    request_body = {
        "raw": encoded_message
    }

    try:

        result = (
            service.users()
            .messages()
            .send(
                userId="me",
                body=request_body,
            )
            .execute()
        )

        return {
            "success": True,
            "message_id": result.get("id"),
        }

    except HttpError as error:

        return {
            "success": False,
            "error": str(error),
        }