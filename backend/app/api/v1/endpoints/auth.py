from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    LoginEmailRequest,
    RefreshRequest,
    RegisterEmailRequest,
    RegisterPhoneRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.services.auth_service import AuthError, login_email, refresh_tokens, register_email, register_phone, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/email", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_with_email(data: RegisterEmailRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_email(db, data)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    from app.core.security import create_access_token, create_refresh_token
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register/phone")
async def register_with_phone(data: RegisterPhoneRequest, db: AsyncSession = Depends(get_db)):
    otp = await register_phone(db, data)
    return {"message": "OTP sent", "otp_mock": otp}  # otp_mock only in dev


@router.post("/verify/otp", response_model=TokenResponse)
async def verify_phone_otp(data: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await verify_otp(db, data.phone, data.otp)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login/email", response_model=TokenResponse)
async def login_with_email(data: LoginEmailRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await login_email(db, data)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await refresh_tokens(db, data.refresh_token)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
