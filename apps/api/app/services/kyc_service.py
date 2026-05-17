"""
KYC Service - NIN verification via Smile Identity.
Correct HMAC-SHA256 signature: base64(HMAC(key, timestamp + partner_id + "sid_request"))
"""
import os
import base64
import hmac
import hashlib
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User

logger = logging.getLogger(__name__)

SMILE_PARTNER_ID  = os.environ.get("SMILE_ID_PARTNER_ID", "")
SMILE_API_KEY     = os.environ.get("SMILE_ID_API_KEY", "")
SMILE_ENVIRONMENT = os.environ.get("SMILE_ID_ENVIRONMENT", "sandbox")

def get_smile_base_url():
    if SMILE_ENVIRONMENT == "production":
        return "https://api.smileidentity.com/v1"
    return "https://testapi.smileidentity.com/v1"

def hash_nin(nin: str) -> str:
    return hashlib.sha256(nin.strip().encode()).hexdigest()

def normalize_name(name: str) -> str:
    return " ".join(name.lower().strip().split())

def names_match(nimc_name: str, account_name: str, threshold: float = 0.6) -> bool:
    nimc = normalize_name(nimc_name)
    account = normalize_name(account_name)
    if nimc == account:
        return True
    account_tokens = set(account.split())
    nimc_tokens = set(nimc.split())
    matched = account_tokens & nimc_tokens
    if len(account_tokens) > 0:
        return len(matched) / len(account_tokens) >= threshold
    return False

def generate_signature():
    timestamp = datetime.now(timezone.utc).isoformat()
    h = hmac.new(SMILE_API_KEY.encode("utf-8"), digestmod=hashlib.sha256)
    h.update(timestamp.encode("utf-8"))
    h.update(str(SMILE_PARTNER_ID).encode("utf-8"))
    h.update("sid_request".encode("utf-8"))
    signature = base64.b64encode(h.digest()).decode("utf-8")
    return timestamp, signature

async def verify_with_smile(nin: str, full_name: str, phone: str) -> dict:
    parts = full_name.strip().split()
    first_name = parts[0] if parts else "."
    last_name  = parts[-1] if len(parts) > 1 else "."
    job_id = f"lv_{hash_nin(nin)[:12]}"
    user_id = hash_nin(nin)[:16]
    timestamp, signature = generate_signature()
    payload = {
        "partner_id": SMILE_PARTNER_ID,
        "timestamp": timestamp,
        "signature": signature,
        "country": "NG",
        "id_type": "NIN",
        "id_number": nin.strip(),
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": phone.replace("+", "").replace(" ", "") or "0000000000",
        "source_sdk": "rest_api",
        "source_sdk_version": "1.0.0",
        "partner_params": {
            "job_id": job_id,
            "user_id": user_id,
            "job_type": 5,
        },
    }
    base_url = get_smile_base_url()
    logger.info(f"Smile Identity NIN verification: partner={SMILE_PARTNER_ID}, job={job_id}, url={base_url}")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"{base_url}/id_verification", json=payload)
        data = res.json()
    logger.info(f"Smile Identity response: status={res.status_code}, data={data}")
    if data.get("code") == "2413" or (isinstance(data.get("error"), str) and data.get("error")):
        return {"verified": False, "nimc_name": "", "message": f"Auth error: {data.get('error', data)}", "provider": "smile_error"}
    result_code = data.get("ResultCode", "")
    result_text = data.get("ResultText", "")
    nimc_name = data.get("FullName", "") or f"{data.get('FirstName','')}{data.get('LastName','')}".strip()
    logger.info(f"Result: code={result_code}, text={result_text}, name={nimc_name}")
    if result_code in ("1012", "1020", "1021"):
        return {"verified": True, "nimc_name": nimc_name, "message": f"NIN verified. NIMC name: {nimc_name}", "provider": "smile_identity"}
    elif result_code == "1014":
        return {"verified": False, "nimc_name": nimc_name, "message": f"Name mismatch. NIMC has '{nimc_name}'.", "provider": "smile_identity"}
    elif result_code == "1011":
        return {"verified": False, "nimc_name": "", "message": "NIN not found in NIMC registry.", "provider": "smile_identity"}
    else:
        return {"verified": False, "nimc_name": "", "message": result_text or f"Verification failed (code: {result_code}).", "provider": "smile_identity"}

async def verify_fallback(nin: str, full_name: str, phone: str) -> dict:
    clean = nin.strip().replace(" ", "")
    if not clean.isdigit() or len(clean) != 11:
        return {"verified": False, "nimc_name": "", "message": "Invalid NIN format. Must be 11 digits.", "provider": "format_check"}
    return {"verified": True, "nimc_name": full_name, "message": "NIN format valid. Smile Identity not configured.", "provider": "format_only"}

class KYCService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def initiate_nin_verification(self, user: User, nin: str, bvn: Optional[str] = None) -> dict:
        clean = nin.strip().replace(" ", "")
        if not clean.isdigit() or len(clean) != 11:
            return {"kyc_status": "rejected", "nin_verified": False, "message": "Invalid NIN format. Must be 11 digits."}
        existing = await self.db.execute(
            select(User).where(User.nin_hash == hash_nin(clean), User.id != user.id)
        )
        if existing.scalar_one_or_none():
            return {"kyc_status": "rejected", "nin_verified": False, "message": "This NIN is already linked to another account."}
        if SMILE_PARTNER_ID and SMILE_API_KEY:
            try:
                result = await verify_with_smile(nin=clean, full_name=user.full_name, phone=user.phone or "")
            except Exception as e:
                logger.error(f"KYC error: {e}")
                return {"kyc_status": "pending", "nin_verified": False, "message": f"Verification error: {str(e)}"}
        else:
            result = await verify_fallback(nin=clean, full_name=user.full_name, phone=user.phone or "")
        if result["verified"]:
            nimc_name = result.get("nimc_name", "")
            if nimc_name and not names_match(nimc_name, user.full_name):
                return {"kyc_status": "rejected", "nin_verified": False, "message": f"Name mismatch. NIMC has '{nimc_name}' but account has '{user.full_name}'."}
            user.nin_hash = hash_nin(clean)
            user.nin_verified = True
            user.kyc_status = "verified"
            await self.db.commit()
            return {"kyc_status": "verified", "nin_verified": True, "message": result["message"]}
        else:
            user.kyc_status = "rejected"
            await self.db.commit()
            return {"kyc_status": "rejected", "nin_verified": False, "message": result["message"]}

    async def get_status(self, user_id: str) -> dict:
        user = await self.get_user(user_id)
        if not user:
            return {"kyc_status": "unknown", "nin_verified": False, "message": "User not found"}
        return {"kyc_status": user.kyc_status, "nin_verified": user.nin_verified, "message": "Verified" if user.nin_verified else "Pending"}
