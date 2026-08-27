from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

from app.providers.base import MailProvider


class SMTPProvider(MailProvider):

    provider_name = "smtp"

    def _build_message(
        self,
        *,
        sender: str,
        recipient: str,
        subject: str,
        body: str,
    ) -> EmailMessage:

        message = EmailMessage()

        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = subject

        message.set_content(
            body
        )

        return message


    def test_connection(
        self,
        *,
        host: str,
        port: int,
        username: str,
        password: str,
        security: str,
    ) -> dict[str, Any]:

        security = security.lower().strip()

        if security not in {
            "ssl",
            "starttls",
        }:
            raise ValueError(
                "Security must be 'ssl' or 'starttls'."
            )

        context = ssl.create_default_context()

        if security == "ssl":

            with smtplib.SMTP_SSL(
                host=host,
                port=port,
                context=context,
                timeout=20,
            ) as server:

                server.login(
                    username,
                    password,
                )

        else:

            with smtplib.SMTP(
                host=host,
                port=port,
                timeout=20,
            ) as server:

                server.ehlo()

                server.starttls(
                    context=context
                )

                server.ehlo()

                server.login(
                    username,
                    password,
                )

        return {
            "success": True,
            "message":
                "SMTP connection successful.",
        }


    def send(
        self,
        *,
        account: dict,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        tokens = (
            account.get(
                "tokens"
            )
            or {}
        )

        host = (
            tokens.get(
                "host"
            )
            or ""
        ).strip()

        username = (
            tokens.get(
                "username"
            )
            or account.get(
                "email"
            )
            or ""
        ).strip()

        password = (
            tokens.get(
                "password"
            )
            or ""
        )

        security = (
            tokens.get(
                "security",
                "ssl",
            )
            or "ssl"
        ).lower().strip()

        try:

            port = int(
                tokens.get(
                    "port",
                    465,
                )
            )

        except (
            TypeError,
            ValueError,
        ):

            return {
                "success": False,
                "error":
                    "Invalid SMTP port.",
            }


        if not host:

            return {
                "success": False,
                "error":
                    "SMTP host is missing.",
            }


        if not username:

            return {
                "success": False,
                "error":
                    "SMTP username is missing.",
            }


        if not password:

            return {
                "success": False,
                "error":
                    "SMTP password is missing.",
            }


        if security not in {
            "ssl",
            "starttls",
        }:

            return {
                "success": False,
                "error":
                    "SMTP security must be SSL or STARTTLS.",
            }


        message = self._build_message(
            sender=(
                account.get(
                    "email"
                )
                or username
            ),
            recipient=recipient,
            subject=subject,
            body=body,
        )


        context = ssl.create_default_context()


        try:

            if security == "ssl":

                with smtplib.SMTP_SSL(
                    host=host,
                    port=port,
                    context=context,
                    timeout=30,
                ) as server:

                    server.login(
                        username,
                        password,
                    )

                    server.send_message(
                        message
                    )

            else:

                with smtplib.SMTP(
                    host=host,
                    port=port,
                    timeout=30,
                ) as server:

                    server.ehlo()

                    server.starttls(
                        context=context
                    )

                    server.ehlo()

                    server.login(
                        username,
                        password,
                    )

                    server.send_message(
                        message
                    )


            return {
                "success": True,
                "message_id": None,
            }


        except smtplib.SMTPAuthenticationError:

            return {
                "success": False,
                "error":
                    (
                        "SMTP authentication failed. "
                        "Check the email address and "
                        "app-specific password."
                    ),
            }


        except (
            smtplib.SMTPConnectError,
            TimeoutError,
            OSError,
        ) as exc:

            return {
                "success": False,
                "error":
                    (
                        "Could not connect to SMTP server: "
                        f"{exc}"
                    ),
            }


        except smtplib.SMTPException as exc:

            return {
                "success": False,
                "error":
                    f"SMTP error: {exc}",
            }


        except Exception as exc:

            return {
                "success": False,
                "error":
                    str(exc),
            }