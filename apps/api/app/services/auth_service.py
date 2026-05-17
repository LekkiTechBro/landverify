from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.redis import get_redis
from app.models.models import User
from app.schemas.auth import SignupRequest
from app.services.email_service import send_welcome_email

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.API_SECRET_KEY, algorithm=settings.API_ALGORITHM,
    )

def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.API_SECRET_KEY, algorithm=settings.API_ALGORITHM,
    )

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(self, payload: SignupRequest) -> Tuple[User, dict]:
        existing = await self.get_user_by_email(payload.email)
        if existing:
            raise ValueError("An account with this email already exists")

        result = await self.db.execute(select(User).where(User.phone == payload.phone))
        if result.scalar_one_or_none():
            raise ValueError("An account with this phone number already exists")

        user = User(
            email=payload.email.lower().strip(),
            phone=payload.phone.strip(),
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            role=payload.role,
            kyc_status="pending",
            nin_verified=False,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        tokens = await self.create_tokens(user)
        try:
            await send_welcome_email(user.email, user.full_name, user.role)
        except:
            pass
        return user, tokens

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()
        return user

    async def create_tokens(self, user: User) -> dict:
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        redis = get_redis()
        if redis:
            await redis.setex(
                f"refresh:{user.id}",
                settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
                refresh_token,
            )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def refresh_access_token(self, refresh_token: str) -> dict:
        try:
            payload = jwt.decode(refresh_token, settings.API_SECRET_KEY, algorithms=[settings.API_ALGORITHM])
        except JWTError:
            raise ValueError("Invalid refresh token")
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id = payload.get("sub")
        user = await self.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found")
        return await self.create_tokens(user)

    async def revoke_tokens(self, user_id: str) -> None:
        redis = get_redis()
        if redis:
            await redis.delete(f"refresh:{user_id}")

    async def send_welcome_email(self, email: str, name: str) -> None:
        pass
