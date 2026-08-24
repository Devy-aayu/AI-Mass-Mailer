<<<<<<< HEAD
from googleapiclient.discovery import build


def create_gmail_service(credentials):
    return build(
        "gmail",
        "v1",
        credentials=credentials
=======
from googleapiclient.discovery import build


def create_gmail_service(credentials):
    return build(
        "gmail",
        "v1",
        credentials=credentials
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    )