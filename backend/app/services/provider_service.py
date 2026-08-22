from __future__ import annotations

from app.providers.gmail import (
    GmailProvider,
)

from app.providers.outlook import (
    OutlookProvider,
)

from app.providers.zoho import (
    ZohoProvider,
)

from app.providers.smtp import (
    SMTPProvider,
)


PROVIDERS = {
    "gmail":
        GmailProvider(),

    "outlook":
        OutlookProvider(),

    "zoho":
        ZohoProvider(),

    "smtp":
        SMTPProvider(),
}


def get_provider(
    provider: str,
):

    provider = (
        provider
        or ""
    ).strip().lower()


    try:

        return PROVIDERS[
            provider
        ]

    except KeyError:

        raise RuntimeError(
            f"Unsupported email provider: {provider}"
        )