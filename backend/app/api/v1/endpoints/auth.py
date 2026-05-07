from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.limiter import limiter
from app.schemas.auth import (
    LoginEmailRequest,
    RefreshRequest,
    RegisterEmailRequest,
    RegisterPhoneRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.services.auth_service import AuthError, login_email, logout, refresh_tokens, register_email, register_phone, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/email", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_with_email(request: Request, data: RegisterEmailRequest, db: AsyncSession = Depends(get_db)):
    from app.services.language_service import detect_language
    language = await detect_language(request)
    try:
        user = await register_email(db, data, language=language)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    from app.core.security import create_access_token, create_refresh_token
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register/phone")
@limiter.limit("3/minute")
async def register_with_phone(request: Request, data: RegisterPhoneRequest, db: AsyncSession = Depends(get_db)):
    await register_phone(db, data)
    return {"message": "OTP sent"}


@router.post("/verify/otp", response_model=TokenResponse)
@limiter.limit("5/minute")
async def verify_phone_otp(request: Request, data: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await verify_otp(db, data.phone, data.otp)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/login/email", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login_with_email(request: Request, data: LoginEmailRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await login_email(db, data)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await refresh_tokens(db, data.refresh_token)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_endpoint(request: Request, data: RefreshRequest):
    try:
        await logout(data.refresh_token)
    except Exception:
        pass
