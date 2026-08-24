<<<<<<< HEAD
import base64
from email.mime.text import MIMEText


def create_message(
    sender: str,
    recipient: str,
    subject: str,
    body: str,
):
    message = MIMEText(
        body,
        "plain",
        "utf-8"
    )

    message["To"] = recipient
    message["From"] = sender
    message["Subject"] = subject

    encoded = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    return {
        "raw": encoded
    }


def send_email(
    gmail_service,
    sender: str,
    recipient: str,
    subject: str,
    body: str,
):
    message = create_message(
        sender=sender,
        recipient=recipient,
        subject=subject,
        body=body,
    )

    return (
        gmail_service
        .users()
        .messages()
        .send(
            userId="me",
            body=message
        )
        .execute()
=======
import base64
from email.mime.text import MIMEText


def create_message(
    sender: str,
    recipient: str,
    subject: str,
    body: str,
):
    message = MIMEText(
        body,
        "plain",
        "utf-8"
    )

    message["To"] = recipient
    message["From"] = sender
    message["Subject"] = subject

    encoded = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    return {
        "raw": encoded
    }


def send_email(
    gmail_service,
    sender: str,
    recipient: str,
    subject: str,
    body: str,
):
    message = create_message(
        sender=sender,
        recipient=recipient,
        subject=subject,
        body=body,
    )

    return (
        gmail_service
        .users()
        .messages()
        .send(
            userId="me",
            body=message
        )
        .execute()
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    )