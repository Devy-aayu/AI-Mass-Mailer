from __future__ import annotations

import difflib
import re
from typing import Any

import pandas as pd


# =========================================================
# REGEX
# =========================================================

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+"
    r"@"
    r"[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$"
)

PHONE_REGEX = re.compile(
    r"^\+?[0-9][0-9\s().\-]{5,}[0-9]$"
)


# =========================================================
# HEADER HINTS
# =========================================================

EMAIL_HEADERS = {
    "email",
    "email address",
    "email_address",
    "e mail",
    "e-mail",
    "e-mail address",
    "mail",
    "contact email",
    "contact_email",
    "business email",
    "work email",
}

PHONE_HEADERS = {
    "phone",
    "phone number",
    "phone_number",
    "mobile",
    "mobile number",
    "mobile_number",
    "telephone",
    "telephone number",
    "tel",
    "contact number",
    "contact_number",
    "whatsapp",
    "whatsapp number",
    "ph",
    "ph no",
    "ph number",
    "phone no",
}

NAME_HEADERS = {
    "name",
    "full name",
    "full_name",
    "lead name",
    "lead_name",
    "contact name",
    "contact_name",
    "customer name",
    "customer_name",
    "person name",
    "owner name",
    "owner",
}

BUSINESS_HEADERS = {
    "business",
    "business name",
    "business_name",
    "business type",
    "business_type",
    "company",
    "company name",
    "company_name",
    "organization",
    "organisation",
    "organization name",
    "organisation name",
    "shop",
    "shop name",
    "store",
    "store name",
    "brand",
    "brand name",
}

WEBSITE_HEADERS = {
    "website",
    "website url",
    "website_url",
    "web",
    "web url",
    "url",
    "domain",
    "site",
    "company website",
    "business website",
}

CATEGORY_HEADERS = {
    "category",
    "business category",
    "business_category",
    "industry",
    "business type",
    "business_type",
    "type",
    "vertical",
    "sector",
    "niche",
}

ADDRESS_HEADERS = {
    "address",
    "location",
    "city",
    "area",
    "street",
    "full address",
    "business address",
}

DESCRIPTION_HEADERS = {
    "description",
    "business description",
    "business_description",
    "about",
    "about business",
    "details",
    "business details",
    "notes",
    "summary",
}


# =========================================================
# NORMALIZATION
# =========================================================

def normalize_header(
    value: Any,
) -> str:

    text = str(
        value
    ).strip().lower()

    text = text.replace(
        "_",
        " ",
    )

    text = text.replace(
        "-",
        " ",
    )

    text = re.sub(
        r"[^\w\s]",
        " ",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def clean_value(
    value: Any,
) -> str:

    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass

    return str(
        value
    ).strip()


# =========================================================
# FUZZY HEADER MATCHING
# =========================================================

def header_similarity(
    actual: str,
    expected: str,
) -> float:

    return difflib.SequenceMatcher(
        None,
        actual,
        expected,
    ).ratio()


def header_score(
    column: Any,
    hints: set[str],
) -> float:

    actual = normalize_header(
        column
    )

    if not actual:
        return 0.0

    if actual in hints:
        return 1.0

    for hint in hints:

        if (
            hint in actual
            or actual in hint
        ):
            return 0.85

    best = 0.0

    for hint in hints:

        similarity = header_similarity(
            actual,
            hint,
        )

        if similarity > best:
            best = similarity

    if best >= 0.82:
        return 0.80

    if best >= 0.72:
        return 0.60

    return 0.0


# =========================================================
# VALUE DETECTORS
# =========================================================

def is_email(
    value: Any,
) -> bool:

    text = clean_value(
        value
    ).lower()

    if not text:
        return False

    if " " in text:
        return False

    return bool(
        EMAIL_REGEX.fullmatch(
            text
        )
    )


def normalize_email(
    value: Any,
) -> str | None:

    text = clean_value(
        value
    ).lower()

    if not is_email(text):
        return None

    return text


def is_phone(
    value: Any,
) -> bool:

    text = clean_value(
        value
    )

    if not text:
        return False

    if re.search(
        r"[A-Za-z]",
        text,
    ):
        return False

    digits = re.sub(
        r"\D",
        "",
        text,
    )

    if len(digits) < 7:
        return False

    if len(digits) > 15:
        return False

    return bool(
        PHONE_REGEX.fullmatch(
            text
        )
    )


def normalize_phone(
    value: Any,
) -> str | None:

    text = clean_value(
        value
    )

    if not is_phone(text):
        return None

    return text


def looks_like_url(
    value: Any,
) -> bool:

    text = clean_value(
        value
    ).lower()

    return (
        text.startswith("http://")
        or text.startswith("https://")
        or text.startswith("www.")
    )


def normalize_url(
    value: Any,
) -> str:

    text = clean_value(
        value
    )

    if not text:
        return ""

    if text.startswith(
        (
            "http://",
            "https://",
        )
    ):
        return text

    if text.startswith(
        "www."
    ):
        return (
            "https://"
            + text
        )

    return (
        "https://"
        + text
    )


# =========================================================
# SCORING
# =========================================================

def sample_values(
    series: pd.Series,
    limit: int = 100,
) -> list[str]:

    values: list[str] = []

    for value in (
        series
        .dropna()
        .head(limit)
        .tolist()
    ):

        text = clean_value(
            value
        )

        if text:
            values.append(
                text
            )

    return values


def value_ratio(
    series: pd.Series,
    validator,
) -> float:

    values = sample_values(
        series
    )

    if not values:
        return 0.0

    matches = sum(
        1
        for value in values
        if validator(value)
    )

    return matches / len(
        values
    )


def score_email(
    series: pd.Series,
    column: Any,
) -> float:

    return round(
        min(
            value_ratio(
                series,
                is_email,
            ) * 0.90
            +
            header_score(
                column,
                EMAIL_HEADERS,
            ) * 0.10,
            1.0,
        ),
        4,
    )


def score_phone(
    series: pd.Series,
    column: Any,
) -> float:

    return round(
        min(
            value_ratio(
                series,
                is_phone,
            ) * 0.85
            +
            header_score(
                column,
                PHONE_HEADERS,
            ) * 0.15,
            1.0,
        ),
        4,
    )


def score_text_field(
    series: pd.Series,
    column: Any,
    hints: set[str],
) -> float:

    values = sample_values(
        series
    )

    if not values:
        return 0.0

    header = header_score(
        column,
        hints,
    )

    readable = 0

    for value in values:

        if (
            not is_email(value)
            and not is_phone(value)
            and len(value) <= 200
        ):
            readable += 1

    readability = (
        readable /
        len(values)
    )

    return round(
        min(
            header * 0.75
            +
            readability * 0.25,
            1.0,
        ),
        4,
    )


def score_website(
    series: pd.Series,
    column: Any,
) -> float:

    return round(
        min(
            value_ratio(
                series,
                looks_like_url,
            ) * 0.80
            +
            header_score(
                column,
                WEBSITE_HEADERS,
            ) * 0.20,
            1.0,
        ),
        4,
    )


# =========================================================
# BEST COLUMN
# =========================================================

def best_column(
    values: list[tuple[Any, float]],
    minimum: float,
) -> tuple[Any | None, float]:

    if not values:
        return None, 0.0

    values = sorted(
        values,
        key=lambda item: item[1],
        reverse=True,
    )

    column, score = values[0]

    if score < minimum:
        return None, score

    return column, score


# =========================================================
# DETECT ALL FIELDS
# =========================================================

def detect_columns(
    df: pd.DataFrame,
) -> dict[str, Any]:

    email_scores = []
    phone_scores = []
    name_scores = []
    business_scores = []
    website_scores = []
    category_scores = []
    address_scores = []
    description_scores = []

    for column in df.columns:

        series = df[column]

        email_scores.append(
            (
                column,
                score_email(
                    series,
                    column,
                ),
            )
        )

        phone_scores.append(
            (
                column,
                score_phone(
                    series,
                    column,
                ),
            )
        )

        name_scores.append(
            (
                column,
                score_text_field(
                    series,
                    column,
                    NAME_HEADERS,
                ),
            )
        )

        business_scores.append(
            (
                column,
                score_text_field(
                    series,
                    column,
                    BUSINESS_HEADERS,
                ),
            )
        )

        website_scores.append(
            (
                column,
                score_website(
                    series,
                    column,
                ),
            )
        )

        category_scores.append(
            (
                column,
                score_text_field(
                    series,
                    column,
                    CATEGORY_HEADERS,
                ),
            )
        )

        address_scores.append(
            (
                column,
                score_text_field(
                    series,
                    column,
                    ADDRESS_HEADERS,
                ),
            )
        )

        description_scores.append(
            (
                column,
                score_text_field(
                    series,
                    column,
                    DESCRIPTION_HEADERS,
                ),
            )
        )

    email_column, email_confidence = best_column(
        email_scores,
        0.45,
    )

    phone_column, phone_confidence = best_column(
        phone_scores,
        0.40,
    )

    name_column, name_confidence = best_column(
        name_scores,
        0.45,
    )

    business_column, business_confidence = best_column(
        business_scores,
        0.40,
    )

    website_column, website_confidence = best_column(
        website_scores,
        0.45,
    )

    category_column, category_confidence = best_column(
        category_scores,
        0.40,
    )

    address_column, address_confidence = best_column(
        address_scores,
        0.40,
    )

    description_column, description_confidence = best_column(
        description_scores,
        0.40,
    )

    reserved = {
        email_column,
        phone_column,
    }

    if name_column in reserved:
        name_column = None
        name_confidence = 0.0

    if business_column in reserved:
        business_column = None
        business_confidence = 0.0

    if website_column in reserved:
        website_column = None
        website_confidence = 0.0

    return {
        "email": {
            "column":
                str(email_column)
                if email_column is not None
                else None,
            "confidence":
                email_confidence,
        },
        "phone": {
            "column":
                str(phone_column)
                if phone_column is not None
                else None,
            "confidence":
                phone_confidence,
        },
        "name": {
            "column":
                str(name_column)
                if name_column is not None
                else None,
            "confidence":
                name_confidence,
        },
        "business": {
            "column":
                str(business_column)
                if business_column is not None
                else None,
            "confidence":
                business_confidence,
        },
        "website": {
            "column":
                str(website_column)
                if website_column is not None
                else None,
            "confidence":
                website_confidence,
        },
        "category": {
            "column":
                str(category_column)
                if category_column is not None
                else None,
            "confidence":
                category_confidence,
        },
        "address": {
            "column":
                str(address_column)
                if address_column is not None
                else None,
            "confidence":
                address_confidence,
        },
        "description": {
            "column":
                str(description_column)
                if description_column is not None
                else None,
            "confidence":
                description_confidence,
        },
    }


# =========================================================
# ROW VALUE
# =========================================================

def extract_value(
    row: pd.Series,
    column: str | None,
) -> str:

    if not column:
        return ""

    return clean_value(
        row.get(
            column
        )
    )