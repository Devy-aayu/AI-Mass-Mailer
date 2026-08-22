from __future__ import annotations

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.services.ai_personalizer import analyze_and_generate_batch
from app.services.ai_store import get_ai_config

router = APIRouter(prefix="/api/ai", tags=["AI"])

class LeadInput(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    company: str = ""
    business_name: str = ""
    website: str = ""
    category: str = ""
    address: str = ""
    description: str = ""
    source_data: dict[str, Any] = {}

class GenerateRequest(BaseModel):
    leads: List[LeadInput]
    campaign_goal: str = Field(min_length=5, max_length=6000)
    base_subject: str = ""
    base_message: str = ""
    tone: str = "professional"

@router.post("/generate")
def generate_ai_campaign(request: GenerateRequest, user: dict = Depends(get_current_user)):
    if not request.leads:
        raise HTTPException(status_code=400, detail="No leads were provided.")
    if len(request.leads) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 leads per AI request.")
    ai_config = get_ai_config(user["id"])
    if not ai_config:
        raise HTTPException(status_code=428, detail="AI is not configured. Add your AI provider, API key, and model in Settings → AI.")
    email_leads = [lead for lead in request.leads if lead.email.strip()]
    if not email_leads:
        raise HTTPException(status_code=400, detail="No email-capable leads were provided.")
    try:
        results = analyze_and_generate_batch(
            leads=[lead.model_dump() for lead in email_leads],
            ai_config=ai_config,
            campaign_goal=request.campaign_goal.strip(),
            base_subject=request.base_subject.strip(),
            base_message=request.base_message.strip(),
            tone=request.tone.strip() or "professional",
        )
    except RuntimeError as exc:
        message = str(exc)
        if "rate limit (429)" in message.lower():
            raise HTTPException(status_code=429, detail=message) from exc
        raise HTTPException(status_code=502, detail=message) from exc
    return {"success": True, "requested": len(email_leads), "generated": len(results), "failed": len(email_leads) - len(results), "results": results}
