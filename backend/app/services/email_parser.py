import re

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)


def is_valid_email(email: str) -> bool:
    if not email:
        return False

    email = email.strip().lower()

    return bool(EMAIL_REGEX.match(email))


def clean_email(email: str) -> str:
    return email.strip().lower()


def extract_unique_emails(values):
    valid = []
    invalid = []

    seen = set()

    for value in values:
        if value is None:
            continue

        email = clean_email(str(value))

        if not email:
            continue

        if is_valid_email(email):
            if email not in seen:
                seen.add(email)
                valid.append(email)
        else:
            invalid.append(email)

    return valid, invalid