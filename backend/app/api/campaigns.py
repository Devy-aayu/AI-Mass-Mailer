from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.services.account_service import list_all_accounts
from app.services.campaign_store import create_campaign, get_campaign, list_campaigns, update_campaign, list_leads

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

class CampaignCreateRequest(BaseModel):
    name: str = Field(default="Untitled Campaign", min_length=1, max_length=160)
    account_id: str | None = None

class CampaignUpdateRequest(BaseModel):
    name: str | None = None
    account_id: str | None = None
    subject: str | None = None
    body: str | None = None
    ai_enabled: bool | None = None

@router.get("")
def campaigns(user: dict = Depends(get_current_user)):
    return {"success": True, "campaigns": list_campaigns(user["id"])}

@router.post("")
def create(payload: CampaignCreateRequest, user: dict = Depends(get_current_user)):
    accounts = list_all_accounts(user["id"])
    if not accounts:
        raise HTTPException(status_code=428, detail="Connect at least one email account before creating a campaign.")
    if payload.account_id and not any(a["id"] == payload.account_id for a in accounts):
        raise HTTPException(status_code=403, detail="Selected sending account does not belong to you.")
    account_id = payload.account_id or accounts[0]["id"]
    return {"success": True, "campaign": create_campaign(user_id=user["id"], name=payload.name, account_id=account_id)}

@router.get("/{campaign_id}")
def campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    item = get_campaign(campaign_id, user_id=user["id"])
    if not item:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    item["leads"] = list_leads(campaign_id)
    return {"success": True, "campaign": item}

@router.patch("/{campaign_id}")
def patch(campaign_id: str, payload: CampaignUpdateRequest, user: dict = Depends(get_current_user)):
    current = get_campaign(campaign_id, user_id=user["id"])
    if not current:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if payload.account_id:
        if not any(a["id"] == payload.account_id for a in list_all_accounts(user["id"])):
            raise HTTPException(status_code=403, detail="Selected sending account does not belong to you.")
    campaign_obj = update_campaign(campaign_id, user_id=user["id"], **payload.model_dump(exclude_none=True))
    return {"success": True, "campaign": campaign_obj}
