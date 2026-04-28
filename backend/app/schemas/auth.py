from pydantic import BaseModel, EmailStr, field_validator


class RegisterEmailRequest(BaseModel):
    email: EmailStr
    password: str
    timezone: str = "UTC"

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class RegisterPhoneRequest(BaseModel):
    phone: str
    timezone: str = "UTC"


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


class LoginEmailRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
