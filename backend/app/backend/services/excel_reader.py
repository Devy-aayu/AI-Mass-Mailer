<<<<<<< HEAD
import io

import pandas as pd

from app.services.lead_detector import (
    detect_columns,
    normalize_email,
    normalize_phone,
)


def read_lead_file(
    filename: str,
    content: bytes,
):
    """
    Read CSV / XLS / XLSX and automatically detect
    email, phone, name and company columns.

    Returns:
        df,
        detected_columns
    """

    filename_lower = filename.lower()

    buffer = io.BytesIO(content)

    if filename_lower.endswith(".csv"):

        try:
            df = pd.read_csv(buffer)
        except UnicodeDecodeError:
            buffer.seek(0)

            df = pd.read_csv(
                buffer,
                encoding="latin1",
            )

    elif filename_lower.endswith(".xlsx"):

        df = pd.read_excel(
            buffer,
            engine="openpyxl",
        )

    elif filename_lower.endswith(".xls"):

        df = pd.read_excel(
            buffer
        )

    else:

        raise ValueError(
            "Unsupported file type. "
            "Please upload CSV, XLSX or XLS."
        )

    if df.empty:
        raise ValueError(
            "The uploaded file is empty."
        )

    detected_columns = detect_columns(df)

    return df, detected_columns


def extract_leads(
    df: pd.DataFrame,
    detected_columns: dict,
):
    """
    Convert the dataframe into normalized lead objects.

    IMPORTANT:
    A lead is considered usable when it has either:
        - a valid email
        OR
        - a valid phone number

    Phone-only leads are retained for future calling /
    WhatsApp / SMS functionality.
    """

    email_column = detected_columns["email"]["column"]
    phone_column = detected_columns["phone"]["column"]
    name_column = detected_columns["name"]["column"]
    company_column = detected_columns["company"]["column"]

    leads = []

    seen_contacts = set()

    for _, row in df.iterrows():

        # ---------------------------------------------------------
        # EMAIL
        # ---------------------------------------------------------

        email = ""

        if email_column:

            raw_email = row.get(
                email_column
            )

            normalized_email = normalize_email(
                raw_email
            )

            if normalized_email:
                email = normalized_email

        # ---------------------------------------------------------
        # PHONE
        # ---------------------------------------------------------

        phone = ""

        if phone_column:

            raw_phone = row.get(
                phone_column
            )

            normalized_phone = normalize_phone(
                raw_phone
            )

            if normalized_phone:
                phone = normalized_phone

        # ---------------------------------------------------------
        # A lead must have at least one usable contact method.
        # ---------------------------------------------------------

        if not email and not phone:
            continue

        # ---------------------------------------------------------
        # DUPLICATE PROTECTION
        #
        # Prefer email as the unique identifier.
        # For phone-only leads, use the phone.
        # ---------------------------------------------------------

        if email:
            contact_key = f"email:{email}"
        else:
            contact_key = f"phone:{phone}"

        if contact_key in seen_contacts:
            continue

        seen_contacts.add(
            contact_key
        )

        # ---------------------------------------------------------
        # NAME
        # ---------------------------------------------------------

        name = ""

        if name_column:

            raw_name = row.get(
                name_column
            )

            if not pd.isna(raw_name):

                name = str(
                    raw_name
                ).strip()

        # IMPORTANT:
        # We DO NOT create a fake name from the
        # email address here.
        #
        # If there is no name, AI can later decide
        # whether to say "Hello there" or address
        # the company instead.
        # ---------------------------------------------------------

        # ---------------------------------------------------------
        # COMPANY
        # ---------------------------------------------------------

        company = ""

        if company_column:

            raw_company = row.get(
                company_column
            )

            if not pd.isna(raw_company):

                company = str(
                    raw_company
                ).strip()

        leads.append(
            {
                "name": name,
                "email": email,
                "phone": phone,
                "company": company,
            }
        )

=======
import io

import pandas as pd

from app.services.lead_detector import (
    detect_columns,
    normalize_email,
    normalize_phone,
)


def read_lead_file(
    filename: str,
    content: bytes,
):
    """
    Read CSV / XLS / XLSX and automatically detect
    email, phone, name and company columns.

    Returns:
        df,
        detected_columns
    """

    filename_lower = filename.lower()

    buffer = io.BytesIO(content)

    if filename_lower.endswith(".csv"):

        try:
            df = pd.read_csv(buffer)
        except UnicodeDecodeError:
            buffer.seek(0)

            df = pd.read_csv(
                buffer,
                encoding="latin1",
            )

    elif filename_lower.endswith(".xlsx"):

        df = pd.read_excel(
            buffer,
            engine="openpyxl",
        )

    elif filename_lower.endswith(".xls"):

        df = pd.read_excel(
            buffer
        )

    else:

        raise ValueError(
            "Unsupported file type. "
            "Please upload CSV, XLSX or XLS."
        )

    if df.empty:
        raise ValueError(
            "The uploaded file is empty."
        )

    detected_columns = detect_columns(df)

    return df, detected_columns


def extract_leads(
    df: pd.DataFrame,
    detected_columns: dict,
):
    """
    Convert the dataframe into normalized lead objects.

    IMPORTANT:
    A lead is considered usable when it has either:
        - a valid email
        OR
        - a valid phone number

    Phone-only leads are retained for future calling /
    WhatsApp / SMS functionality.
    """

    email_column = detected_columns["email"]["column"]
    phone_column = detected_columns["phone"]["column"]
    name_column = detected_columns["name"]["column"]
    company_column = detected_columns["company"]["column"]

    leads = []

    seen_contacts = set()

    for _, row in df.iterrows():

        # ---------------------------------------------------------
        # EMAIL
        # ---------------------------------------------------------

        email = ""

        if email_column:

            raw_email = row.get(
                email_column
            )

            normalized_email = normalize_email(
                raw_email
            )

            if normalized_email:
                email = normalized_email

        # ---------------------------------------------------------
        # PHONE
        # ---------------------------------------------------------

        phone = ""

        if phone_column:

            raw_phone = row.get(
                phone_column
            )

            normalized_phone = normalize_phone(
                raw_phone
            )

            if normalized_phone:
                phone = normalized_phone

        # ---------------------------------------------------------
        # A lead must have at least one usable contact method.
        # ---------------------------------------------------------

        if not email and not phone:
            continue

        # ---------------------------------------------------------
        # DUPLICATE PROTECTION
        #
        # Prefer email as the unique identifier.
        # For phone-only leads, use the phone.
        # ---------------------------------------------------------

        if email:
            contact_key = f"email:{email}"
        else:
            contact_key = f"phone:{phone}"

        if contact_key in seen_contacts:
            continue

        seen_contacts.add(
            contact_key
        )

        # ---------------------------------------------------------
        # NAME
        # ---------------------------------------------------------

        name = ""

        if name_column:

            raw_name = row.get(
                name_column
            )

            if not pd.isna(raw_name):

                name = str(
                    raw_name
                ).strip()

        # IMPORTANT:
        # We DO NOT create a fake name from the
        # email address here.
        #
        # If there is no name, AI can later decide
        # whether to say "Hello there" or address
        # the company instead.
        # ---------------------------------------------------------

        # ---------------------------------------------------------
        # COMPANY
        # ---------------------------------------------------------

        company = ""

        if company_column:

            raw_company = row.get(
                company_column
            )

            if not pd.isna(raw_company):

                company = str(
                    raw_company
                ).strip()

        leads.append(
            {
                "name": name,
                "email": email,
                "phone": phone,
                "company": company,
            }
        )

>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    return leads