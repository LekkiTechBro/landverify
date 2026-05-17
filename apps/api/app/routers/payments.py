"""
Payments router â€” /api/v1/payments
Handles Paystack escrow initiation, verification, and webhooks.
"""

import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import User
from app.services.payment_service import (
    initiate_payment, verify_payment,
    verify_webhook_signature, naira_to_kobo,
    generate_reference, ESCROW_MILESTONES,
)

router = APIRouter()

# In-memory escrow store (replace with DB in production)
ESCROW_STORE: dict = {}


class InitiateEscrowRequest(BaseModel):
    property_id: str
    property_title: str
    amount_naira: float
    seller_id: str
    callback_url: Optional[str] = "http://localhost:3005/payment/callback"


class EscrowStatusUpdate(BaseModel):
    escrow_id: str
    milestone: str  # "legal_search", "deed_signing", "fund_release"


@router.post("/escrow/initiate")
async def initiate_escrow(
    payload: InitiateEscrowRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate an escrow payment for a property."""
    reference = generate_reference(current_user.id, payload.property_id)
    amount_kobo = naira_to_kobo(payload.amount_naira)

    metadata = {
        "property_id": payload.property_id,
        "property_title": payload.property_title,
        "buyer_id": current_user.id,
        "seller_id": payload.seller_id,
        "escrow": True,
        "custom_fields": [
            { "display_name": "Property", "variable_name": "property", "value": payload.property_title },
            { "display_name": "Buyer", "variable_name": "buyer", "value": current_user.email },
            { "display_name": "Transaction Type", "variable_name": "type", "value": "Escrow Payment" },
        ],
    }

    result = await initiate_payment(
        email=current_user.email,
        amount_kobo=amount_kobo,
        reference=reference,
        metadata=metadata,
        callback_url=payload.callback_url,
    )

    if not result.get("status"):
        raise HTTPException(status_code=400, detail=result.get("message", "Payment initiation failed"))

    # Store escrow record
    escrow_id = f"escrow_{reference}"
    ESCROW_STORE[escrow_id] = {
        "id": escrow_id,
        "reference": reference,
        "buyer_id": current_user.id,
        "buyer_email": current_user.email,
        "seller_id": payload.seller_id,
        "property_id": payload.property_id,
        "property_title": payload.property_title,
        "amount_naira": payload.amount_naira,
        "amount_kobo": amount_kobo,
        "status": "pending",
        "current_milestone": None,
        "milestones_completed": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": None,
    }

    return {
        "escrow_id": escrow_id,
        "reference": reference,
        "authorization_url": result["data"]["authorization_url"],
        "access_code": result["data"]["access_code"],
        "amount_naira": payload.amount_naira,
        "message": "Redirect buyer to authorization_url to complete payment",
    }


@router.get("/escrow/verify/{reference}")
async def verify_escrow_payment(
    reference: str,
    current_user: User = Depends(get_current_user),
):
    """Verify payment after Paystack redirect."""
    result = await verify_payment(reference)

    if not result.get("status"):
        raise HTTPException(status_code=400, detail="Verification failed")

    data = result.get("data", {})
    payment_status = data.get("status")

    # Find and update escrow record
    escrow = next((e for e in ESCROW_STORE.values() if e["reference"] == reference), None)
    if escrow:
        if payment_status == "success":
            escrow["status"] = "secured"
            escrow["current_milestone"] = "payment_secured"
            escrow["milestones_completed"] = ["payment_secured"]
            escrow["paid_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "payment_status": payment_status,
        "amount_naira": data.get("amount", 0) / 100,
        "reference": reference,
        "escrow_secured": payment_status == "success",
        "message": "Payment secured in escrow. Funds will be released upon deed signing." if payment_status == "success" else "Payment not completed",
    }


@router.get("/escrow/{escrow_id}")
async def get_escrow_status(
    escrow_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get current escrow status and milestone progress."""
    escrow = ESCROW_STORE.get(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if escrow["buyer_id"] != current_user.id and escrow["seller_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    milestones_status = []
    for m in ESCROW_MILESTONES:
        milestones_status.append({
            **m,
            "completed": m["key"] in escrow.get("milestones_completed", []),
            "current": m["key"] == escrow.get("current_milestone"),
        })

    return {
        **escrow,
        "milestones": milestones_status,
    }


@router.post("/escrow/{escrow_id}/advance")
async def advance_milestone(
    escrow_id: str,
    current_user: User = Depends(get_current_user),
):
    """Advance escrow to next milestone â€” ADMIN ONLY."""
    if current_user.role not in ("admin", "field_verifier"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can advance escrow milestones. Contact LandVerify support.",
        )
    escrow = ESCROW_STORE.get(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    milestone_keys = [m["key"] for m in ESCROW_MILESTONES]
    current = escrow.get("current_milestone")
    completed = escrow.get("milestones_completed", [])

    if current is None:
        next_milestone = milestone_keys[0]
    else:
        current_idx = milestone_keys.index(current)
        if current_idx >= len(milestone_keys) - 1:
            raise HTTPException(status_code=400, detail="All milestones already completed")
        next_milestone = milestone_keys[current_idx + 1]

    if next_milestone not in completed:
        completed.append(next_milestone)
    escrow["current_milestone"] = next_milestone
    escrow["milestones_completed"] = completed

    if next_milestone == "fund_release":
        escrow["status"] = "completed"

    return {
        "escrow_id": escrow_id,
        "advanced_to": next_milestone,
        "status": escrow["status"],
        "milestones_completed": completed,
    }


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request):
    """Handle Paystack webhook events."""
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event = await request.json()
    event_type = event.get("event")
    data = event.get("data", {})

    if event_type == "charge.success":
        reference = data.get("reference")
        escrow = next((e for e in ESCROW_STORE.values() if e["reference"] == reference), None)
        if escrow:
            escrow["status"] = "secured"
            escrow["current_milestone"] = "payment_secured"
            escrow["milestones_completed"] = ["payment_secured"]
            escrow["paid_at"] = datetime.now(timezone.utc).isoformat()

    return JSONResponse({"status": "ok"})


@router.get("/my-escrows")
async def get_my_escrows(current_user: User = Depends(get_current_user)):
    """Get all escrow transactions for the current user."""
    escrows = [
        e for e in ESCROW_STORE.values()
        if e["buyer_id"] == current_user.id or e["seller_id"] == current_user.id
    ]
    return {"escrows": escrows, "total": len(escrows)}

