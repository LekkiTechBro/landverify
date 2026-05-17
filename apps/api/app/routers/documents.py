"""
Documents router — /api/v1/documents
Handles signed URL generation, encrypted storage, watermarked viewing.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import base64
import time
import datetime

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import User
from app.services.document_service import (
    generate_signed_token,
    verify_signed_token,
    encrypt_document,
    decrypt_document,
    generate_watermark_svg,
    create_audit_entry,
)

router = APIRouter()

# In-memory store (replace with S3/Supabase Storage in production)
DOCUMENT_STORE: dict = {}
AUDIT_LOG: list = []


class DocumentUpload(BaseModel):
    name: str
    type: str
    property_id: Optional[str] = None
    data_base64: str


class SignedUrlRequest(BaseModel):
    document_id: str
    expires_in: int = 120


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    payload: DocumentUpload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        raw_bytes = base64.b64decode(payload.data_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data")

    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    encrypted = encrypt_document(raw_bytes)
    doc_id = f"doc_{current_user.id[:8]}_{len(DOCUMENT_STORE):04d}"

    DOCUMENT_STORE[doc_id] = {
        "id": doc_id,
        "name": payload.name,
        "type": payload.type,
        "owner_id": current_user.id,
        "property_id": payload.property_id,
        "encrypted": encrypted,
        "size_bytes": len(raw_bytes),
        "uploaded_at": datetime.datetime.utcnow().isoformat(),
    }

    return {
        "document_id": doc_id,
        "name": payload.name,
        "type": payload.type,
        "size_bytes": len(raw_bytes),
        "encrypted": True,
        "algorithm": "AES-256-GCM",
        "message": "Document encrypted and stored securely.",
    }


@router.post("/signed-url")
async def get_signed_url(
    payload: SignedUrlRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    doc = DOCUMENT_STORE.get(payload.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this document.")

    token = generate_signed_token(
        document_id=payload.document_id,
        user_id=current_user.id,
        user_email=current_user.email,
        expires_in=payload.expires_in,
    )

    AUDIT_LOG.append(create_audit_entry(
        document_id=payload.document_id,
        user_id=current_user.id,
        user_email=current_user.email,
        action="signed_url_generated",
        ip_address=request.client.host if request.client else "unknown",
    ))

    base_url = str(request.base_url).rstrip("/")
    return {
        "signed_url": f"{base_url}/api/v1/documents/view/{payload.document_id}?token={token}",
        "expires_in": payload.expires_in,
        "expires_at": time.time() + payload.expires_in,
        "watermarked": True,
        "message": f"Link expires in {payload.expires_in} seconds. Do not share.",
    }


@router.get("/view/{document_id}")
async def view_document(
    document_id: str,
    token: str,
    request: Request,
):
    payload = verify_signed_token(token)
    if not payload:
        AUDIT_LOG.append({
            "document_id": document_id,
            "action": "token_expired_or_invalid",
            "ip_address": request.client.host if request.client else "unknown",
            "timestamp": datetime.datetime.utcnow().isoformat(),
        })
        raise HTTPException(
            status_code=403,
            detail="This link has expired or is invalid. Please request a new link.",
        )

    doc = DOCUMENT_STORE.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    AUDIT_LOG.append(create_audit_entry(
        document_id=document_id,
        user_id=payload["uid"],
        user_email=payload["email"],
        action="document_viewed",
        ip_address=request.client.host if request.client else "unknown",
    ))

    watermark_svg = generate_watermark_svg(
        user_email=payload["email"],
        user_id=payload["uid"],
    )

    decrypted = decrypt_document(doc["encrypted"])
    content_b64 = base64.b64encode(decrypted).decode()

    return JSONResponse({
        "document_id": document_id,
        "name": doc["name"],
        "type": doc["type"],
        "content_base64": content_b64,
        "watermark_svg": watermark_svg,
        "watermark_text": f"CONFIDENTIAL · {payload['email']} · LandVerify",
        "viewed_by": payload["email"],
        "viewed_at": datetime.datetime.utcnow().isoformat(),
        "warning": "This document is watermarked with your identity. Unauthorized sharing is traceable.",
    })


@router.get("/my")
async def get_my_documents(
    current_user: User = Depends(get_current_user),
):
    docs = [
        {
            "id": doc["id"],
            "name": doc["name"],
            "type": doc["type"],
            "property_id": doc["property_id"],
            "size_bytes": doc["size_bytes"],
            "uploaded_at": doc["uploaded_at"],
            "encrypted": True,
        }
        for doc in DOCUMENT_STORE.values()
        if doc["owner_id"] == current_user.id
    ]
    return {"documents": docs, "total": len(docs)}


@router.get("/audit/{document_id}")
async def get_audit_log(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    doc = DOCUMENT_STORE.get(document_id)
    if not doc or doc["owner_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    logs = [e for e in AUDIT_LOG if e.get("document_id") == document_id]
    return {"document_id": document_id, "access_log": logs, "total_views": len(logs)}
