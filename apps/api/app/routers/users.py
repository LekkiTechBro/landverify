"""
Users router - /api/v1/users
Admin user management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.models import User

router = APIRouter()


class UserUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    kyc_status: Optional[str] = None


@router.get("")
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all users — admin only."""
    result = await db.execute(
        select(User).where(User.deleted_at == None).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "phone": u.phone,
            "full_name": u.full_name,
            "role": u.role,
            "kyc_status": u.kyc_status,
            "nin_verified": u.nin_verified,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in users
    ]


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update user status — admin only."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        user.role = payload.role
    if payload.kyc_status is not None:
        user.kyc_status = payload.kyc_status

    await db.commit()
    return {"message": "User updated", "user_id": user_id, "is_active": user.is_active}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user — admin only."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role,
        "kyc_status": user.kyc_status,
        "nin_verified": user.nin_verified,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
