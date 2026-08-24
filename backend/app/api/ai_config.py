from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user
from app.services.ai_store import delete_ai_config, get_ai_config, save_ai_config

router = APIRouter(prefix="/api/ai", tags=["AI Configuration"])


class AIConfigRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=200)
    api_key: str = Field(min_length=1, max_length=1000)
    base_url: str = Field(default="", max_length=500)


def _public_config(config: dict | None) -> dict | None:
    if not config:
        return None
    return {
        "id": config["id"],
        "provider": config["provider"],
        "model": config["model"],
        "base_url": config.get("base_url", ""),
        "configured": True,
    }


@router.get("/config")
def get_config(user: dict = Depends(get_current_user)):
    return {"success": True, "config": _public_config(get_ai_config(user["id"]))}


@router.put("/config")
def put_config(payload: AIConfigRequest, user: dict = Depends(get_current_user)):
    provider = payload.provider.strip().lower()
    if provider not in {"openrouter", "openai_compatible"}:
        raise HTTPException(status_code=400, detail="Supported AI providers: openrouter and openai_compatible.")
    if provider == "openai_compatible" and not payload.base_url.strip():
        raise HTTPException(status_code=400, detail="Base URL is required for an OpenAI-compatible provider.")
    config = save_ai_config(
        user_id=user["id"],
        provider=provider,
        model=payload.model.strip(),
        base_url=payload.base_url.strip(),
        api_key=payload.api_key.strip(),
    )
    return {"success": True, "config": _public_config(config)}


@router.delete("/config")
def remove_config(user: dict = Depends(get_current_user)):
    return {"success": True, "deleted": delete_ai_config(user["id"])}
