"""
Reviews router - /api/v1/reviews
Star ratings and written reviews for agents and properties.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import User

router = APIRouter()


class CreateReviewRequest(BaseModel):
    target_type: str  # "agent" or "property"
    target_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    property_id: Optional[str] = None  # required if reviewing agent


async def ensure_reviews_table(db: AsyncSession):
    """Create reviews table if it doesn't exist."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reviewer_id UUID NOT NULL REFERENCES users(id),
            target_type VARCHAR(20) NOT NULL,
            target_id UUID NOT NULL,
            property_id UUID REFERENCES properties(id),
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(reviewer_id, target_type, target_id)
        )
    """))
    await db.commit()


@router.post("")
async def create_review(
    payload: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a review for an agent or property."""
    await ensure_reviews_table(db)

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Check if already reviewed
    existing = await db.execute(text("""
        SELECT id FROM reviews
        WHERE reviewer_id = :reviewer_id
        AND target_type = :target_type
        AND target_id = :target_id
    """), {"reviewer_id": current_user.id, "target_type": payload.target_type, "target_id": payload.target_id})

    if existing.fetchone():
        raise HTTPException(status_code=400, detail="You have already reviewed this.")

    result = await db.execute(text("""
        INSERT INTO reviews (reviewer_id, target_type, target_id, property_id, rating, comment)
        VALUES (:reviewer_id, :target_type, :target_id, :property_id, :rating, :comment)
        RETURNING id, created_at
    """), {
        "reviewer_id": current_user.id,
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "property_id": payload.property_id,
        "rating": payload.rating,
        "comment": payload.comment,
    })
    await db.commit()
    row = result.fetchone()

    return {
        "id": str(row.id),
        "message": "Review submitted successfully",
        "rating": payload.rating,
        "created_at": row.created_at.isoformat(),
    }


@router.get("/{target_type}/{target_id}")
async def get_reviews(
    target_type: str,
    target_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all reviews for an agent or property."""
    await ensure_reviews_table(db)

    result = await db.execute(text("""
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.full_name as reviewer_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.target_type = :target_type AND r.target_id = :target_id
        ORDER BY r.created_at DESC
        LIMIT 50
    """), {"target_type": target_type, "target_id": target_id})

    rows = result.fetchall()

    # Calculate average rating
    avg_result = await db.execute(text("""
        SELECT AVG(rating)::FLOAT, COUNT(*)
        FROM reviews
        WHERE target_type = :target_type AND target_id = :target_id
    """), {"target_type": target_type, "target_id": target_id})
    avg_row = avg_result.fetchone()

    return {
        "target_type": target_type,
        "target_id": target_id,
        "average_rating": round(avg_row[0] or 0, 1),
        "total_reviews": avg_row[1] or 0,
        "reviews": [
            {
                "id": str(r.id),
                "rating": r.rating,
                "comment": r.comment,
                "reviewer_name": r.reviewer_name,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
    }
