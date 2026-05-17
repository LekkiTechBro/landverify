"""
Payment Service — Paystack integration for escrow payments.
Handles: initiate, verify, refund, transfer (fund release).
"""

import hmac
import hashlib
import json
import os
from typing import Optional
from datetime import datetime, timezone
import httpx

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "sk_test_d1223447a803bb137862715c653ddccaab4bf85a")
PAYSTACK_BASE = "https://api.paystack.co"


# ── Payment initiation ─────────────────────────────────────────────────────

async def initiate_payment(
    email: str,
    amount_kobo: int,        # Paystack uses kobo (100 kobo = ₦1)
    reference: str,
    metadata: dict,
    callback_url: str,
) -> dict:
    """
    Initiate a Paystack payment. Returns authorization_url for redirect.
    """
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "amount": amount_kobo,
        "reference": reference,
        "metadata": metadata,
        "callback_url": callback_url,
        "channels": ["card", "bank", "ussd", "mobile_money"],
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{PAYSTACK_BASE}/transaction/initialize", headers=headers, json=payload)
        return res.json()


async def verify_payment(reference: str) -> dict:
    """
    Verify a payment by reference. Call this after redirect or webhook.
    """
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{PAYSTACK_BASE}/transaction/verify/{reference}", headers=headers)
        return res.json()


# ── Webhook verification ───────────────────────────────────────────────────

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Paystack webhook signature using HMAC-SHA512.
    """
    expected = hmac.new(
        PAYSTACK_SECRET.encode(),
        payload,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── Escrow helpers ─────────────────────────────────────────────────────────

def naira_to_kobo(naira: float) -> int:
    """Convert Naira to Kobo for Paystack."""
    return int(naira * 100)


def kobo_to_naira(kobo: int) -> float:
    """Convert Kobo to Naira."""
    return kobo / 100


def generate_reference(user_id: str, property_id: str) -> str:
    """Generate a unique payment reference."""
    import secrets
    ts = int(datetime.now(timezone.utc).timestamp())
    nonce = secrets.token_hex(4).upper()
    return f"LV-{user_id[:6].upper()}-{property_id[:6].upper()}-{ts}-{nonce}"


ESCROW_MILESTONES = [
    { "key": "payment_secured",  "label": "Payment Secured",   "desc": "Funds held safely in escrow", "icon": "🔒" },
    { "key": "legal_search",     "label": "Legal Search",      "desc": "Title registry verification in progress", "icon": "🔍" },
    { "key": "deed_signing",     "label": "Deed Signing",      "desc": "Documents reviewed and signed by both parties", "icon": "✍️" },
    { "key": "fund_release",     "label": "Fund Release",      "desc": "Funds released to seller upon completion", "icon": "✅" },
]
