"""
Database models — SQLAlchemy 2.0 async ORM.

Conventions:
- All models inherit from Base
- Use UUID primary keys (no sequential ints — safe for sharding)
- All timestamps in UTC
- Soft delete with deleted_at (never hard delete user/property records)
"""

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, JSON, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


def new_uuid() -> str:
    return str(uuid.uuid4())


# ── Users ─────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        SAEnum("client", "agent", "field_verifier", "admin", name="user_role"),
        nullable=False,
        default="client"
    )
    kyc_status: Mapped[str] = mapped_column(
        SAEnum("pending", "submitted", "verified", "rejected", "expired", name="kyc_status"),
        nullable=False,
        default="pending"
    )
    nin_hash: Mapped[Optional[str]] = mapped_column(String(255))   # hashed, never raw
    bvn_hash: Mapped[Optional[str]] = mapped_column(String(255))
    nin_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    agent_profile: Mapped[Optional["AgentProfile"]] = relationship(back_populates="user")
    properties: Mapped[List["Property"]] = relationship(back_populates="agent")
    chat_rooms_as_client: Mapped[List["ChatRoom"]] = relationship(foreign_keys="ChatRoom.client_id", back_populates="client")
    chat_rooms_as_agent: Mapped[List["ChatRoom"]] = relationship(foreign_keys="ChatRoom.agent_id", back_populates="agent")


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), primary_key=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255))
    license_number: Mapped[Optional[str]] = mapped_column(String(100))
    states_covered: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    lgas_covered: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    subscription_tier: Mapped[str] = mapped_column(
        SAEnum("free", "professional", "premium", name="agent_tier"),
        default="free"
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    deals_closed: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=False)  # false until KYC + subscription
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="agent_profile")


# ── Properties ────────────────────────────────────────────

class Property(Base):
    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)

    # Core info
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(50), nullable=False)     # flat, land, detached...
    purpose: Mapped[str] = mapped_column(String(20), nullable=False)  # sale, rent, shortlet
    status: Mapped[str] = mapped_column(String(30), default="available", index=True)

    # Nigeria location — critical for 36-state search
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    lga: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    address_detail: Mapped[Optional[str]] = mapped_column(String(500))  # disclosed after inquiry
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)

    # Financials (stored in Naira, no decimals)
    price: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    price_negotiable: Mapped[bool] = mapped_column(Boolean, default=True)
    service_charge: Mapped[Optional[int]] = mapped_column(Integer)
    caution_fee: Mapped[Optional[int]] = mapped_column(Integer)

    # Specs
    bedrooms: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    bathrooms: Mapped[Optional[int]] = mapped_column(Integer)
    toilets: Mapped[Optional[int]] = mapped_column(Integer)
    size_sqm: Mapped[Optional[float]] = mapped_column(Float)
    parking_spaces: Mapped[Optional[int]] = mapped_column(Integer)
    floors: Mapped[Optional[int]] = mapped_column(Integer)

    # Title info — the core differentiator
    title_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="unverified", index=True)

    # Risk score (denormalised for fast search sorting)
    risk_score: Mapped[Optional[int]] = mapped_column(Integer)        # 0–100
    risk_level: Mapped[Optional[str]] = mapped_column(String(20))     # low/medium/high/critical

    # Media
    photos: Mapped[List[dict]] = mapped_column(JSON, default=list)
    virtual_tour_url: Mapped[Optional[str]] = mapped_column(String(500))
    floor_plan_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Engagement
    views: Mapped[int] = mapped_column(Integer, default=0)
    inquiries: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    agent: Mapped["User"] = relationship(back_populates="properties")
    verification_records: Mapped[List["VerificationRecord"]] = relationship(back_populates="property")
    chat_rooms: Mapped[List["ChatRoom"]] = relationship(back_populates="property")

    # Composite index for the most common search query
    __table_args__ = (
        Index("ix_properties_state_lga_status", "state", "lga", "status"),
        Index("ix_properties_purpose_price", "purpose", "price"),
        Index("ix_properties_title_type_risk", "title_type", "risk_level"),
    )


# ── Verification ──────────────────────────────────────────

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    property_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("properties.id"), nullable=False, index=True)
    initiated_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    assigned_verifier: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), default="unverified", index=True)

    # Documents
    documents: Mapped[List[dict]] = mapped_column(JSON, default=list)

    # Registry check
    registry_reference: Mapped[Optional[str]] = mapped_column(String(200))
    registry_result: Mapped[Optional[str]] = mapped_column(String(50))   # clear/encumbered/not_found
    registry_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Field inspection
    field_inspection_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    field_notes: Mapped[Optional[str]] = mapped_column(Text)
    field_photos: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)

    # Computed risk
    risk_score_data: Mapped[Optional[dict]] = mapped_column(JSON)

    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property: Mapped["Property"] = relationship(back_populates="verification_records")


# ── Chat ──────────────────────────────────────────────────

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    property_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("properties.id"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    property: Mapped["Property"] = relationship(back_populates="chat_rooms")
    client: Mapped["User"] = relationship(foreign_keys=[client_id], back_populates="chat_rooms_as_client")
    agent: Mapped["User"] = relationship(foreign_keys=[agent_id], back_populates="chat_rooms_as_agent")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="room")

    __table_args__ = (
        UniqueConstraint("property_id", "client_id", name="uq_one_room_per_inquiry"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    room_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("chat_rooms.id"), nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)          # AES-encrypted
    message_type: Mapped[str] = mapped_column(String(30), default="text")
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    room: Mapped["ChatRoom"] = relationship(back_populates="messages")


# ── Payments / Escrow ─────────────────────────────────────

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # Paystack ref
    type: Mapped[str] = mapped_column(String(50))   # subscription, inspection_fee, verification_fee
    amount: Mapped[int] = mapped_column(Integer, nullable=False)     # Kobo (Paystack standard)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)  # pending/success/failed/refunded
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
