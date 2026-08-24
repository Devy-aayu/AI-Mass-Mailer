<<<<<<< HEAD
from __future__ import annotations

import io
import re

import pandas as pd

from app.services.lead_detector import (
    detect_columns,
    extract_value,
    normalize_email,
    normalize_phone,
    normalize_url,
)


SENSITIVE_COLUMN_PATTERNS = {
    "password",
    "passwd",
    "secret",
    "api key",
    "apikey",
    "token",
    "credit card",
    "card number",
    "cvv",
    "security code",
}


def load_dataframe(
    filename: str,
    content: bytes,
) -> pd.DataFrame:

    filename_lower = (
        filename.lower()
    )

    buffer = io.BytesIO(
        content
    )

    if filename_lower.endswith(
        ".csv"
    ):

        try:

            return pd.read_csv(
                buffer
            )

        except UnicodeDecodeError:

            buffer.seek(0)

            return pd.read_csv(
                buffer,
                encoding="latin1",
            )


    if filename_lower.endswith(
        ".xlsx"
    ):

        return pd.read_excel(
            buffer,
            engine="openpyxl",
        )


    if filename_lower.endswith(
        ".xls"
    ):

        return pd.read_excel(
            buffer
        )


    raise ValueError(
        "Unsupported file type. "
        "Please upload CSV, XLSX or XLS."
    )


def is_sensitive_column(
    column: str,
) -> bool:

    normalized = re.sub(
        r"[_\-]+",
        " ",
        column.lower(),
    ).strip()

    return any(
        pattern in normalized
        for pattern in SENSITIVE_COLUMN_PATTERNS
    )


def build_raw_data(
    row: pd.Series,
) -> dict[str, str]:

    raw_data: dict[str, str] = {}

    for column in row.index:

        column_name = str(
            column
        )

        if is_sensitive_column(
            column_name
        ):
            continue

        value = str(
            row.get(
                column
            )
        ).strip()

        if not value:
            continue

        if value.lower() == "nan":
            continue

        raw_data[column_name] = value

    return raw_data


def read_lead_file(
    filename: str,
    content: bytes,
):

    df = load_dataframe(
        filename,
        content,
    )

    if df.empty:

        raise ValueError(
            "The uploaded file is empty."
        )

    detected = detect_columns(
        df
    )

    email_column = (
        detected["email"]["column"]
    )

    phone_column = (
        detected["phone"]["column"]
    )

    if (
        email_column is None
        and phone_column is None
    ):

        raise ValueError(
            "Could not detect an email or phone field."
        )

    return (
        df,
        detected,
    )


def extract_leads(
    df: pd.DataFrame,
    detected: dict,
) -> list[dict]:

    email_column = (
        detected["email"]["column"]
    )

    phone_column = (
        detected["phone"]["column"]
    )

    name_column = (
        detected["name"]["column"]
    )

    business_column = (
        detected["business"]["column"]
    )

    website_column = (
        detected["website"]["column"]
    )

    category_column = (
        detected["category"]["column"]
    )

    address_column = (
        detected["address"]["column"]
    )

    description_column = (
        detected["description"]["column"]
    )

    leads: list[dict] = []

    seen_contacts = set()

    for _, row in df.iterrows():

        email = normalize_email(
            extract_value(
                row,
                email_column,
            )
        ) or ""

        phone = normalize_phone(
            extract_value(
                row,
                phone_column,
            )
        ) or ""

        # A lead is usable when it has either
        # email OR phone.
        if not email and not phone:
            continue

        contact_key = (
            f"email:{email}"
            if email
            else f"phone:{phone}"
        )

        if contact_key in seen_contacts:
            continue

        seen_contacts.add(
            contact_key
        )

        name = extract_value(
            row,
            name_column,
        )

        business = extract_value(
            row,
            business_column,
        )

        website = extract_value(
            row,
            website_column,
        )

        category = extract_value(
            row,
            category_column,
        )

        address = extract_value(
            row,
            address_column,
        )

        description = extract_value(
            row,
            description_column,
        )

        if website:
            website = normalize_url(
                website
            )

        # IMPORTANT:
        # Preserve the entire useful source row.
        #
        # Therefore:
        # "bussiness": "clinic"
        #
        # survives even if Python's semantic detector
        # doesn't recognize the misspelled header.
        raw_data = build_raw_data(
            row
        )

        leads.append(
            {
                "name": name,
                "email": email,
                "phone": phone,
                "company": business,
                "business_name": business,
                "website": website,
                "category": category,
                "address": address,
                "description": description,
                "source_data": raw_data,
            }
        )

=======
from __future__ import annotations

import io
import re

import pandas as pd

from app.services.lead_detector import (
    detect_columns,
    extract_value,
    normalize_email,
    normalize_phone,
    normalize_url,
)


SENSITIVE_COLUMN_PATTERNS = {
    "password",
    "passwd",
    "secret",
    "api key",
    "apikey",
    "token",
    "credit card",
    "card number",
    "cvv",
    "security code",
}


def load_dataframe(
    filename: str,
    content: bytes,
) -> pd.DataFrame:

    filename_lower = (
        filename.lower()
    )

    buffer = io.BytesIO(
        content
    )

    if filename_lower.endswith(
        ".csv"
    ):

        try:

            return pd.read_csv(
                buffer
            )

        except UnicodeDecodeError:

            buffer.seek(0)

            return pd.read_csv(
                buffer,
                encoding="latin1",
            )


    if filename_lower.endswith(
        ".xlsx"
    ):

        return pd.read_excel(
            buffer,
            engine="openpyxl",
        )


    if filename_lower.endswith(
        ".xls"
    ):

        return pd.read_excel(
            buffer
        )


    raise ValueError(
        "Unsupported file type. "
        "Please upload CSV, XLSX or XLS."
    )


def is_sensitive_column(
    column: str,
) -> bool:

    normalized = re.sub(
        r"[_\-]+",
        " ",
        column.lower(),
    ).strip()

    return any(
        pattern in normalized
        for pattern in SENSITIVE_COLUMN_PATTERNS
    )


def build_raw_data(
    row: pd.Series,
) -> dict[str, str]:

    raw_data: dict[str, str] = {}

    for column in row.index:

        column_name = str(
            column
        )

        if is_sensitive_column(
            column_name
        ):
            continue

        value = str(
            row.get(
                column
            )
        ).strip()

        if not value:
            continue

        if value.lower() == "nan":
            continue

        raw_data[column_name] = value

    return raw_data


def read_lead_file(
    filename: str,
    content: bytes,
):

    df = load_dataframe(
        filename,
        content,
    )

    if df.empty:

        raise ValueError(
            "The uploaded file is empty."
        )

    detected = detect_columns(
        df
    )

    email_column = (
        detected["email"]["column"]
    )

    phone_column = (
        detected["phone"]["column"]
    )

    if (
        email_column is None
        and phone_column is None
    ):

        raise ValueError(
            "Could not detect an email or phone field."
        )

    return (
        df,
        detected,
    )


def extract_leads(
    df: pd.DataFrame,
    detected: dict,
) -> list[dict]:

    email_column = (
        detected["email"]["column"]
    )

    phone_column = (
        detected["phone"]["column"]
    )

    name_column = (
        detected["name"]["column"]
    )

    business_column = (
        detected["business"]["column"]
    )

    website_column = (
        detected["website"]["column"]
    )

    category_column = (
        detected["category"]["column"]
    )

    address_column = (
        detected["address"]["column"]
    )

    description_column = (
        detected["description"]["column"]
    )

    leads: list[dict] = []

    seen_contacts = set()

    for _, row in df.iterrows():

        email = normalize_email(
            extract_value(
                row,
                email_column,
            )
        ) or ""

        phone = normalize_phone(
            extract_value(
                row,
                phone_column,
            )
        ) or ""

        # A lead is usable when it has either
        # email OR phone.
        if not email and not phone:
            continue

        contact_key = (
            f"email:{email}"
            if email
            else f"phone:{phone}"
        )

        if contact_key in seen_contacts:
            continue

        seen_contacts.add(
            contact_key
        )

        name = extract_value(
            row,
            name_column,
        )

        business = extract_value(
            row,
            business_column,
        )

        website = extract_value(
            row,
            website_column,
        )

        category = extract_value(
            row,
            category_column,
        )

        address = extract_value(
            row,
            address_column,
        )

        description = extract_value(
            row,
            description_column,
        )

        if website:
            website = normalize_url(
                website
            )

        # IMPORTANT:
        # Preserve the entire useful source row.
        #
        # Therefore:
        # "bussiness": "clinic"
        #
        # survives even if Python's semantic detector
        # doesn't recognize the misspelled header.
        raw_data = build_raw_data(
            row
        )

        leads.append(
            {
                "name": name,
                "email": email,
                "phone": phone,
                "company": business,
                "business_name": business,
                "website": website,
                "category": category,
                "address": address,
                "description": description,
                "source_data": raw_data,
            }
        )

>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    return leads