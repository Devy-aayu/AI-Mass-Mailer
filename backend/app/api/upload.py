from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    Form,
)

from app.auth.dependencies import get_current_user
from app.services.campaign_store import add_leads, get_campaign
from app.services.excel_reader import (
    extract_leads,
    read_lead_file,
)


router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"],
)


def percentage(
    value: float,
) -> int:

    return round(
        max(
            0.0,
            min(
                1.0,
                value,
            ),
        )
        * 100
    )


@router.post("")
async def upload_leads(
    file: UploadFile = File(...),
    campaign_id: str = Form(...),
    user: dict = Depends(get_current_user),
):

    if not get_campaign(campaign_id, user_id=user["id"]):
        raise HTTPException(status_code=404, detail="Campaign not found.")

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )


    filename = (
        file.filename.lower()
    )


    if not (
        filename.endswith(".csv")
        or filename.endswith(".xlsx")
        or filename.endswith(".xls")
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV, XLSX and XLS "
                "files are supported."
            ),
        )


    try:

        contents = await file.read()

        df, detected = read_lead_file(
            file.filename,
            contents,
        )

        leads = extract_leads(
            df,
            detected,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not process the file: {exc}"
            ),
        )


    if not leads:

        raise HTTPException(
            status_code=400,
            detail=(
                "No usable leads were found."
            ),
        )


    email_leads = [
        lead
        for lead in leads
        if lead.get("email")
    ]


    phone_leads = [
        lead
        for lead in leads
        if lead.get("phone")
    ]


    both = [
        lead
        for lead in leads
        if (
            lead.get("email")
            and lead.get("phone")
        )
    ]


    add_leads(campaign_id, leads)

    return {
        "success":
            True,

        "filename":
            file.filename,

        "total_rows":
            len(df),

        "usable_leads":
            len(leads),

        "email_leads":
            len(email_leads),

        "phone_leads":
            len(phone_leads),

        "both_contact_methods":
            len(both),

        "no_contact_rows":
            max(
                len(df) - len(leads),
                0,
            ),

        # Compatibility fields.
        "valid_emails":
            len(email_leads),

        "invalid_emails":
            max(
                len(df) - len(leads),
                0,
            ),

        "detected_columns": {
            key: {
                "column":
                    value["column"],
                "confidence":
                    percentage(
                        value["confidence"]
                    ),
            }
            for key, value
            in detected.items()
        },

        "email_column":
            detected["email"]["column"],

        "phone_column":
            detected["phone"]["column"],

        "name_column":
            detected["name"]["column"],

        "company_column":
            detected["business"]["column"],

        "website_column":
            detected["website"]["column"],

        "category_column":
            detected["category"]["column"],

        "address_column":
            detected["address"]["column"],

        "description_column":
            detected["description"]["column"],

        "leads":
            leads,

        "emails": [
            lead["email"]
            for lead in email_leads
        ],
    }
