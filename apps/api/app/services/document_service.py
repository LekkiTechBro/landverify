"""
Document Service — AES-256 encryption, signed URLs, watermarking.
Uses Python cryptography package for AES-256-GCM.
"""

import os
import hmac
import hashlib
import base64
import time
import json
import secrets
from typing import Optional
from datetime import datetime, timezone

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


def _get_secret() -> str:
    return os.environ.get("API_SECRET_KEY", "landverify-dev-secret-key-change-in-production")


# ── Signed URL generation ──────────────────────────────────────────────────

def generate_signed_token(
    document_id: str,
    user_id: str,
    user_email: str,
    expires_in: int = 120,
) -> str:
    payload = {
        "doc": document_id,
        "uid": user_id,
        "email": user_email,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()),
        "nonce": secrets.token_hex(8),
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode()
    secret = _get_secret().encode()
    sig = hmac.new(secret, payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_signed_token(token: str) -> Optional[dict]:
    try:
        payload_b64, sig = token.rsplit(".", 1)
        secret = _get_secret().encode()
        expected_sig = hmac.new(secret, payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        if payload["exp"] < int(time.time()):
            return None
        return payload
    except Exception:
        return None


# ── AES-256-GCM encryption ─────────────────────────────────────────────────

def _get_aes_key() -> bytes:
    return hashlib.sha256(_get_secret().encode()).digest()


def encrypt_document(data: bytes) -> dict:
    key = _get_aes_key()
    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(data) + encryptor.finalize()
    return {
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "iv": base64.b64encode(iv).decode(),
        "tag": base64.b64encode(encryptor.tag).decode(),
        "algorithm": "AES-256-GCM",
    }


def decrypt_document(encrypted: dict) -> bytes:
    key = _get_aes_key()
    iv = base64.b64decode(encrypted["iv"])
    tag = base64.b64decode(encrypted["tag"])
    ciphertext = base64.b64decode(encrypted["ciphertext"])
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()


# ── Watermark generation ───────────────────────────────────────────────────

def generate_watermark_text(user_email: str, user_id: str, timestamp: Optional[datetime] = None) -> str:
    ts = timestamp or datetime.now(timezone.utc)
    ts_str = ts.strftime("%Y-%m-%d %H:%M UTC")
    uid_short = user_id[:8].upper()
    return f"CONFIDENTIAL · {user_email} · ID:{uid_short} · {ts_str} · LandVerify"


def generate_watermark_svg(user_email: str, user_id: str) -> str:
    text = generate_watermark_text(user_email, user_id)
    rows = []
    for y in range(0, 1000, 120):
        for x in range(-200, 1200, 400):
            rows.append(
                f'<text x="{x}" y="{y}" transform="rotate(-30 {x} {y})" '
                f'fill="rgba(10,92,63,0.12)" font-size="13" font-family="system-ui,sans-serif" '
                f'font-weight="500" letter-spacing="1">{text}</text>'
            )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" '
        'style="position:absolute;top:0;left:0;pointer-events:none;z-index:100">'
        + "".join(rows)
        + "</svg>"
    )


# ── Audit logging ──────────────────────────────────────────────────────────

def create_audit_entry(
    document_id: str,
    user_id: str,
    user_email: str,
    action: str,
    ip_address: str = "unknown",
) -> dict:
    return {
        "document_id": document_id,
        "user_id": user_id,
        "user_email": user_email,
        "action": action,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "watermark": generate_watermark_text(user_email, user_id),
    }
