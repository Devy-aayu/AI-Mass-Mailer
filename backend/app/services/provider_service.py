<<<<<<< HEAD
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
=======
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
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
        )