from googleapiclient.discovery import build


def create_gmail_service(credentials):
    return build(
        "gmail",
        "v1",
        credentials=credentials
    )