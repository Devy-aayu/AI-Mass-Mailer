from __future__ import annotations

import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.config import (
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_SECURE,
)
from app.services.user_store import (
    create_user,
    get_user_by_email,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    name: str = Field(
        default="",
        max_length=120,
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=128,
    )


def _public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
    }


def _set_session(
    response: Response,
    user_id: str,
) -> None:
                                                                              
                                                                      
    samesite_val = "lax"

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_access_token(user_id),
        httponly=True,

                                  
        secure=AUTH_COOKIE_SECURE,

                    
                                                                                     
                                                                                         
        samesite=samesite_val,

        max_age=60 * 60 * 24 * 7,
        path="/",
    )


@router.post("/signup")
def signup(
    payload: SignupRequest,
    response: Response,
):
    email = (
        str(payload.email)
        .strip()
        .lower()
    )

    if get_user_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    if not re.search(
        r"[A-Za-z]",
        payload.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one letter.",
        )

    if not re.search(
        r"\d",
        payload.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number.",
        )

    user = create_user(
        email=email,
        name=payload.name,
        password_hash=hash_password(
            payload.password
        ),
    )

    _set_session(
        response,
        user["id"],
    )

    return {
        "success": True,
        "user": _public_user(user),
    }


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
):
    email = (
        str(payload.email)
        .strip()
        .lower()
    )

    user = get_user_by_email(
        email
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(
        payload.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    _set_session(
        response,
        user["id"],
    )

    return {
        "success": True,
        "user": _public_user(user),
    }


@router.post("/logout")
def logout(
    response: Response,
):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
    )

    return {
        "success": True,
    }


@router.get("/me")
def me(
    user: dict = Depends(
        get_current_user
    ),
):
    return {
        "success": True,
        "user": _public_user(user),
    }