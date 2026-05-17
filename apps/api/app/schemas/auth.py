from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
import re

class SignupRequest(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    password: str
    role: str = "client"
    nin: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 14:
            raise ValueError("Enter a valid Nigerian phone number")
        if digits.startswith("0"):
            digits = "234" + digits[1:]
        return "+" + digits

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("client", "agent"):
            raise ValueError("Role must be client or agent")
        return v

class UserResponse(BaseModel):
    id: str
    email: str
    phone: str
    full_name: str
    role: str
    kyc_status: str
    nin_verified: bool
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class SignupResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class KYCInitiateRequest(BaseModel):
    nin: str
    bvn: Optional[str] = None

class KYCStatusResponse(BaseModel):
    kyc_status: str
    nin_verified: bool = False
    message: Optional[str] = None