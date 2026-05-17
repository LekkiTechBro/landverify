from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    SignupRequest, SignupResponse, RefreshTokenRequest,
    TokenResponse, KYCInitiateRequest, KYCStatusResponse, UserResponse,
)
from app.services.auth_service import AuthService
from app.services.email_service import send_welcome_email
from app.services.kyc_service import KYCService
from app.middleware.auth import get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        user, tokens = await service.create_user(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    background_tasks.add_task(send_welcome_email, user.email, user.full_name, user.role)
    return SignupResponse(user=UserResponse.model_validate(user), tokens=tokens)

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user = await service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    tokens = await service.create_tokens(user)
    from app.services.email_service import send_login_notification_email
    try:
        await send_login_notification_email(user.email, user.full_name)
    except:
        pass
    return {
        "user": UserResponse.model_validate(user),
        "tokens": tokens,
        "access_token": tokens["access_token"],
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        tokens = await service.refresh_access_token(payload.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return tokens

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.revoke_tokens(current_user.id)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/kyc/initiate", response_model=KYCStatusResponse)
async def initiate_kyc(
    payload: KYCInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    kyc_service = KYCService(db)
    return await kyc_service.initiate_nin_verification(
        user=current_user, nin=payload.nin, bvn=payload.bvn,
    )

@router.get("/kyc/status", response_model=KYCStatusResponse)
async def kyc_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    kyc_service = KYCService(db)
    return await kyc_service.get_status(current_user.id)

import secrets as _secrets
_reset_tokens: dict = {}

@router.post("/forgot-password")
async def forgot_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    from app.services.email_service import send_email
    email = payload.get("email", "").lower().strip()
    service = AuthService(db)
    user = await service.get_user_by_email(email)
    if user:
        token = _secrets.token_urlsafe(32)
        from datetime import datetime, timedelta, timezone
        _reset_tokens[token] = {"user_id": str(user.id), "email": user.email, "expires": datetime.now(timezone.utc) + timedelta(hours=1)}
        reset_url = f"http://localhost:3005/auth/reset-password?token={token}"
        html = f"<div style='font-family:system-ui'><h2>Reset Your LandVerify Password</h2><p>Hi {user.full_name},</p><a href='{reset_url}' style='background:#0A5C3F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0'>Reset Password</a><p style='color:#888;font-size:12px'>Link expires in 1 hour.</p></div>"
        await send_email(user.email, "Reset Your LandVerify Password", html)
    return {"message": "If an account exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    from app.services.auth_service import hash_password
    token = payload.get("token", "")
    new_password = payload.get("new_password", "")
    if not token or token not in _reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    token_data = _reset_tokens[token]
    if datetime.now(timezone.utc) > token_data["expires"]:
        del _reset_tokens[token]
        raise HTTPException(status_code=400, detail="Reset link expired. Please request a new one.")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    service = AuthService(db)
    user = await service.get_user_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.hashed_password = hash_password(new_password)
    await db.commit()
    del _reset_tokens[token]
    return {"message": "Password reset successfully."}



