from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


def _is_private_hostname(
    hostname: str,
) -> bool:

    if not hostname:
        return True

    if hostname.lower() in {
        "localhost",
        "localhost.localdomain",
    }:
        return True

    try:

        addresses = socket.getaddrinfo(
            hostname,
            None,
        )

        for address in addresses:

            ip_text = address[4][0]

            ip = ipaddress.ip_address(
                ip_text
            )

            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
            ):
                return True

    except Exception:

        return True

    return False


def fetch_website_text(
    url: str,
    max_chars: int = 5000,
) -> str:

    if not url:
        return ""

    try:

        parsed = urlparse(
            url
        )

        if parsed.scheme not in {
            "http",
            "https",
        }:
            return ""

        hostname = (
            parsed.hostname
            or ""
        )

        if _is_private_hostname(
            hostname
        ):
            return ""

        response = requests.get(
            url,
            timeout=8,
            headers={
                "User-Agent":
                    "RitnavMailer/1.0",
            },
            allow_redirects=True,
        )

        response.raise_for_status()

        content_type = (
            response.headers
            .get(
                "content-type",
                "",
            )
            .lower()
        )

        if (
            "text/html"
            not in content_type
        ):
            return ""

        soup = BeautifulSoup(
            response.text,
            "html.parser",
        )

        for tag in soup(
            [
                "script",
                "style",
                "noscript",
                "svg",
                "nav",
                "footer",
            ]
        ):
            tag.decompose()

        text = soup.get_text(
            " ",
            strip=True,
        )

        text = " ".join(
            text.split()
        )

        return text[:max_chars]

    except Exception:

        return ""