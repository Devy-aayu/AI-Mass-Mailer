<<<<<<< HEAD
from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from app.services.excel_reader import (
    extract_leads,
    read_lead_file,
)

from app.services.lead_detector import (
    confidence_percent,
)


router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"],
)


@router.post("")
async def upload_leads(
    file: UploadFile = File(...),
):

    # -------------------------------------------------------------
    # FILE CHECK
    # -------------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    filename = file.filename.lower()

    if not (
        filename.endswith(".csv")
        or filename.endswith(".xlsx")
        or filename.endswith(".xls")
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV, XLSX and XLS files "
                "are supported."
            ),
        )

    # -------------------------------------------------------------
    # READ FILE
    # -------------------------------------------------------------

    try:

        contents = await file.read()

        df, detected_columns = read_lead_file(
            file.filename,
            contents,
        )

        leads = extract_leads(
            df,
            detected_columns,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not process the file: {error}"
            ),
        )

    # -------------------------------------------------------------
    # CHECK USABLE LEADS
    # -------------------------------------------------------------

    if not leads:

        raise HTTPException(
            status_code=400,
            detail=(
                "No usable leads were found. "
                "At least an email address or phone number "
                "is required."
            ),
        )

    # -------------------------------------------------------------
    # CONTACT STATISTICS
    # -------------------------------------------------------------

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

    both_contact_methods = [
        lead
        for lead in leads
        if lead.get("email")
        and lead.get("phone")
    ]

    no_contact_rows = (
        len(df) - len(leads)
    )

    # -------------------------------------------------------------
    # DETECTION INFO
    # -------------------------------------------------------------

    email_info = detected_columns["email"]
    phone_info = detected_columns["phone"]
    name_info = detected_columns["name"]
    company_info = detected_columns["company"]

    # -------------------------------------------------------------
    # RESPONSE
    # -------------------------------------------------------------

    return {

        "success": True,

        "filename": file.filename,

        # Spreadsheet statistics
        "total_rows": len(df),

        # New terminology
        "usable_leads": len(leads),

        "email_leads": len(
            email_leads
        ),

        "phone_leads": len(
            phone_leads
        ),

        "both_contact_methods": len(
            both_contact_methods
        ),

        "no_contact_rows": max(
            no_contact_rows,
            0,
        ),

        # ---------------------------------------------------------
        # Backwards-compatible fields
        #
        # These can remain temporarily so older frontend code
        # doesn't immediately break.
        # ---------------------------------------------------------

        "valid_emails": len(
            email_leads
        ),

        "invalid_emails": max(
            no_contact_rows,
            0,
        ),

        # ---------------------------------------------------------
        # COLUMN DETECTION
        # ---------------------------------------------------------

        "email_column": (
            email_info["column"]
        ),

        "email_confidence": confidence_percent(
            email_info["confidence"]
        ),

        "phone_column": (
            phone_info["column"]
        ),

        "phone_confidence": confidence_percent(
            phone_info["confidence"]
        ),

        "name_column": (
            name_info["column"]
        ),

        "name_confidence": confidence_percent(
            name_info["confidence"]
        ),

        "company_column": (
            company_info["column"]
        ),

        "company_confidence": confidence_percent(
            company_info["confidence"]
        ),

        "detected_columns": {
            "email": email_info,
            "phone": phone_info,
            "name": name_info,
            "company": company_info,
        },

        # ---------------------------------------------------------
        # LEADS
        # ---------------------------------------------------------

        "leads": leads,

        # Only email-capable leads should be sent by
        # the current Gmail campaign system.
        "emails": [
            lead["email"]
            for lead in email_leads
        ],
=======
from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from app.services.excel_reader import (
    extract_leads,
    read_lead_file,
)

from app.services.lead_detector import (
    confidence_percent,
)


router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"],
)


@router.post("")
async def upload_leads(
    file: UploadFile = File(...),
):

    # -------------------------------------------------------------
    # FILE CHECK
    # -------------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    filename = file.filename.lower()

    if not (
        filename.endswith(".csv")
        or filename.endswith(".xlsx")
        or filename.endswith(".xls")
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV, XLSX and XLS files "
                "are supported."
            ),
        )

    # -------------------------------------------------------------
    # READ FILE
    # -------------------------------------------------------------

    try:

        contents = await file.read()

        df, detected_columns = read_lead_file(
            file.filename,
            contents,
        )

        leads = extract_leads(
            df,
            detected_columns,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not process the file: {error}"
            ),
        )

    # -------------------------------------------------------------
    # CHECK USABLE LEADS
    # -------------------------------------------------------------

    if not leads:

        raise HTTPException(
            status_code=400,
            detail=(
                "No usable leads were found. "
                "At least an email address or phone number "
                "is required."
            ),
        )

    # -------------------------------------------------------------
    # CONTACT STATISTICS
    # -------------------------------------------------------------

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

    both_contact_methods = [
        lead
        for lead in leads
        if lead.get("email")
        and lead.get("phone")
    ]

    no_contact_rows = (
        len(df) - len(leads)
    )

    # -------------------------------------------------------------
    # DETECTION INFO
    # -------------------------------------------------------------

    email_info = detected_columns["email"]
    phone_info = detected_columns["phone"]
    name_info = detected_columns["name"]
    company_info = detected_columns["company"]

    # -------------------------------------------------------------
    # RESPONSE
    # -------------------------------------------------------------

    return {

        "success": True,

        "filename": file.filename,

        # Spreadsheet statistics
        "total_rows": len(df),

        # New terminology
        "usable_leads": len(leads),

        "email_leads": len(
            email_leads
        ),

        "phone_leads": len(
            phone_leads
        ),

        "both_contact_methods": len(
            both_contact_methods
        ),

        "no_contact_rows": max(
            no_contact_rows,
            0,
        ),

        # ---------------------------------------------------------
        # Backwards-compatible fields
        #
        # These can remain temporarily so older frontend code
        # doesn't immediately break.
        # ---------------------------------------------------------

        "valid_emails": len(
            email_leads
        ),

        "invalid_emails": max(
            no_contact_rows,
            0,
        ),

        # ---------------------------------------------------------
        # COLUMN DETECTION
        # ---------------------------------------------------------

        "email_column": (
            email_info["column"]
        ),

        "email_confidence": confidence_percent(
            email_info["confidence"]
        ),

        "phone_column": (
            phone_info["column"]
        ),

        "phone_confidence": confidence_percent(
            phone_info["confidence"]
        ),

        "name_column": (
            name_info["column"]
        ),

        "name_confidence": confidence_percent(
            name_info["confidence"]
        ),

        "company_column": (
            company_info["column"]
        ),

        "company_confidence": confidence_percent(
            company_info["confidence"]
        ),

        "detected_columns": {
            "email": email_info,
            "phone": phone_info,
            "name": name_info,
            "company": company_info,
        },

        # ---------------------------------------------------------
        # LEADS
        # ---------------------------------------------------------

        "leads": leads,

        # Only email-capable leads should be sent by
        # the current Gmail campaign system.
        "emails": [
            lead["email"]
            for lead in email_leads
        ],
>>>>>>> 584b136ab801c7a8b9073ed3b1816c8cd59aac82
    }