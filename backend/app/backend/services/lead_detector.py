from __future__ import annotations

import re
from typing import Any

import pandas as pd


# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+"
    r"@"
    r"[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9]"
    r"(?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$"
)

PHONE_REGEX = re.compile(
    r"^\+?[0-9][0-9\s().\-]{6,}[0-9]$"
)


# ---------------------------------------------------------------------------
# Header hints
# These are ONLY hints. Detection is primarily value-based.
# ---------------------------------------------------------------------------

EMAIL_HEADER_HINTS = {
    "email",
    "email address",
    "email_address",
    "e-mail",
    "e-mail address",
    "mail",
    "contact email",
    "contact_email",
    "business email",
    "business_email",
    "work email",
    "work_email",
    "contact",
}

PHONE_HEADER_HINTS = {
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
}

NAME_HEADER_HINTS = {
    "name",
    "full name",
    "full_name",
    "lead name",
    "lead_name",
    "contact name",
    "contact_name",
    "customer name",
    "customer_name",
    "person",
    "person name",
}

COMPANY_HEADER_HINTS = {
    "company",
    "company name",
    "company_name",
    "business",
    "business name",
    "business_name",
    "organization",
    "organisation",
    "organization name",
    "organisation name",
    "shop",
    "shop name",
    "store",
    "store name",
    "brand",
}


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------

def normalize_header(value: Any) -> str:
    """
    Convert a column header into a comparable normalized form.
    """
    text = str(value).strip().lower()

    text = text.replace("-", " ")
    text = text.replace("_", " ")
    text = re.sub(r"\s+", " ", text)

    return text


def normalize_email(value: Any) -> str | None:
    """
    Normalize a possible email address.
    """
    if value is None:
        return None

    if pd.isna(value):
        return None

    text = str(value).strip().lower()

    if not text:
        return None

    # Remove accidental surrounding whitespace.
    text = text.strip()

    if not is_probable_email(text):
        return None

    return text


def normalize_phone(value: Any) -> str | None:
    """
    Normalize a possible phone number.

    This intentionally keeps the original country prefix when available
    instead of trying to guess country codes.
    """
    if value is None:
        return None

    if pd.isna(value):
        return None

    text = str(value).strip()

    if not text:
        return None

    # Excel may turn some values into floats such as 919876543210.0
    if text.endswith(".0") and text[:-2].isdigit():
        text = text[:-2]

    if not is_probable_phone(text):
        return None

    return text


# ---------------------------------------------------------------------------
# Value detectors
# ---------------------------------------------------------------------------

def is_probable_email(value: Any) -> bool:
    """
    Return True when a value looks like a real email address.
    """
    if value is None:
        return False

    if pd.isna(value):
        return False

    text = str(value).strip().lower()

    if not text:
        return False

    # Must contain exactly one @.
    if text.count("@") != 1:
        return False

    # Spaces strongly indicate bad data.
    if any(char.isspace() for char in text):
        return False

    # Reject obvious URLs.
    if text.startswith(("http://", "https://", "www.")):
        return False

    local, domain = text.rsplit("@", 1)

    if not local or not domain:
        return False

    if "." not in domain:
        return False

    if domain.startswith(".") or domain.endswith("."):
        return False

    if ".." in text:
        return False

    return bool(EMAIL_REGEX.fullmatch(text))


def is_probable_phone(value: Any) -> bool:
    """
    Return True when a value reasonably resembles a phone number.

    We intentionally do not require a country code because spreadsheets
    often contain domestic numbers.
    """
    if value is None:
        return False

    if pd.isna(value):
        return False

    text = str(value).strip()

    if not text:
        return False

    if text.endswith(".0") and text[:-2].isdigit():
        text = text[:-2]

    digits = re.sub(r"\D", "", text)

    # Reject values that contain too few or too many digits.
    if len(digits) < 7 or len(digits) > 15:
        return False

    # If there are letters, it is probably not a phone number.
    if re.search(r"[A-Za-z]", text):
        return False

    return bool(PHONE_REGEX.fullmatch(text))


# ---------------------------------------------------------------------------
# Column scoring
# ---------------------------------------------------------------------------

def _sample_values(series: pd.Series, limit: int = 100) -> list[str]:
    """
    Return a clean sample of non-empty values from a dataframe column.
    """
    values: list[str] = []

    for value in series.dropna().head(limit).tolist():
        text = str(value).strip()

        if text:
            values.append(text)

    return values


def _header_score(header: Any, hints: set[str]) -> float:
    """
    Score the column header from 0 to 1.
    """
    normalized = normalize_header(header)

    if normalized in hints:
        return 1.0

    for hint in hints:
        if hint in normalized:
            return 0.7

    return 0.0


def score_email_column(
    series: pd.Series,
    header: Any,
) -> float:
    """
    Score a column as an email column.

    Value-based detection has substantially more weight than the header.
    """
    values = _sample_values(series)

    if not values:
        return 0.0

    matches = sum(
        1
        for value in values
        if is_probable_email(value)
    )

    value_ratio = matches / len(values)
    header_ratio = _header_score(
        header,
        EMAIL_HEADER_HINTS,
    )

    # A genuine column full of email addresses should score very highly.
    score = (
        value_ratio * 0.85
        + header_ratio * 0.15
    )

    return round(min(score, 1.0), 4)


def score_phone_column(
    series: pd.Series,
    header: Any,
) -> float:
    """
    Score a column as a phone column.
    """
    values = _sample_values(series)

    if not values:
        return 0.0

    matches = sum(
        1
        for value in values
        if is_probable_phone(value)
    )

    value_ratio = matches / len(values)
    header_ratio = _header_score(
        header,
        PHONE_HEADER_HINTS,
    )

    score = (
        value_ratio * 0.85
        + header_ratio * 0.15
    )

    return round(min(score, 1.0), 4)


def score_text_column(
    series: pd.Series,
    header: Any,
    hints: set[str],
) -> float:
    """
    Generic score for name/company style columns.

    Because names and companies are ambiguous, headers have more influence
    here than they do for email detection.
    """
    values = _sample_values(series)

    if not values:
        return 0.0

    header_ratio = _header_score(
        header,
        hints,
    )

    # We avoid pretending that arbitrary text can be identified with
    # the same confidence as an email address.
    score = header_ratio * 0.75

    # Mild boost when the cells look like useful human-readable text.
    readable_values = 0

    for value in values:
        if 1 <= len(value) <= 120 and not is_probable_email(value):
            readable_values += 1

    if values:
        readability_ratio = readable_values / len(values)
        score += readability_ratio * 0.25

    return round(min(score, 1.0), 4)


# ---------------------------------------------------------------------------
# Main detector
# ---------------------------------------------------------------------------

def detect_columns(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Detect likely email, phone, name and company columns.

    Returns:
    {
        "email": {
            "column": "...",
            "confidence": 0.99
        },
        "phone": {
            "column": "...",
            "confidence": 0.95
        },
        ...
    }
    """

    if df.empty:
        return {
            "email": {
                "column": None,
                "confidence": 0.0,
            },
            "phone": {
                "column": None,
                "confidence": 0.0,
            },
            "name": {
                "column": None,
                "confidence": 0.0,
            },
            "company": {
                "column": None,
                "confidence": 0.0,
            },
        }

    email_scores: list[tuple[Any, float]] = []
    phone_scores: list[tuple[Any, float]] = []
    name_scores: list[tuple[Any, float]] = []
    company_scores: list[tuple[Any, float]] = []

    for column in df.columns:
        series = df[column]

        email_scores.append(
            (
                column,
                score_email_column(
                    series,
                    column,
                ),
            )
        )

        phone_scores.append(
            (
                column,
                score_phone_column(
                    series,
                    column,
                ),
            )
        )

        name_scores.append(
            (
                column,
                score_text_column(
                    series,
                    column,
                    NAME_HEADER_HINTS,
                ),
            )
        )

        company_scores.append(
            (
                column,
                score_text_column(
                    series,
                    column,
                    COMPANY_HEADER_HINTS,
                ),
            )
        )

    def best(
        scores: list[tuple[Any, float]],
        minimum: float = 0.5,
    ) -> tuple[Any | None, float]:
        scores = sorted(
            scores,
            key=lambda item: item[1],
            reverse=True,
        )

        if not scores:
            return None, 0.0

        column, confidence = scores[0]

        if confidence < minimum:
            return None, confidence

        return column, confidence

    email_column, email_confidence = best(
        email_scores,
        minimum=0.45,
    )

    phone_column, phone_confidence = best(
        phone_scores,
        minimum=0.45,
    )

    name_column, name_confidence = best(
        name_scores,
        minimum=0.45,
    )

    company_column, company_confidence = best(
        company_scores,
        minimum=0.45,
    )

    # Do not let email/phone columns also become the name/company column.
    reserved_columns = {
        email_column,
        phone_column,
    }

    if name_column in reserved_columns:
        name_column = None
        name_confidence = 0.0

    if company_column in reserved_columns:
        company_column = None
        company_confidence = 0.0

    return {
        "email": {
            "column": (
                str(email_column)
                if email_column is not None
                else None
            ),
            "confidence": round(
                email_confidence,
                4,
            ),
        },
        "phone": {
            "column": (
                str(phone_column)
                if phone_column is not None
                else None
            ),
            "confidence": round(
                phone_confidence,
                4,
            ),
        },
        "name": {
            "column": (
                str(name_column)
                if name_column is not None
                else None
            ),
            "confidence": round(
                name_confidence,
                4,
            ),
        },
        "company": {
            "column": (
                str(company_column)
                if company_column is not None
                else None
            ),
            "confidence": round(
                company_confidence,
                4,
            ),
        },
    }


def confidence_percent(value: float) -> int:
    """
    Convert 0.97 -> 97.
    """
    return round(max(0.0, min(value, 1.0)) * 100)