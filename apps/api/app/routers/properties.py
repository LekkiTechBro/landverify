from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.properties import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    PropertyListResponse, PropertySearchQuery,
)
from app.services.property_service import PropertyService
from app.middleware.auth import get_current_user, require_role
from app.models.models import User

router = APIRouter()


@router.get("", response_model=PropertyListResponse)
async def search_properties(
    state: Optional[str] = Query(None),
    lga: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    purpose: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    title_type: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None),
    bedrooms: Optional[int] = Query(None, ge=0),
    verified_only: bool = Query(False),
    risk_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("newest"),
    db: AsyncSession = Depends(get_db),
):
    service = PropertyService(db)
    query = PropertySearchQuery(
        state=state, lga=lga, area=area, purpose=purpose,
        type=type, title_type=title_type, min_price=min_price,
        max_price=max_price, bedrooms=bedrooms,
        verified_only=verified_only, risk_level=risk_level,
        page=page, per_page=per_page, sort_by=sort_by,
    )
    return await service.search(query)


@router.get("/my", response_model=list[PropertyResponse])
async def get_my_properties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all properties listed by the current logged-in user."""
    service = PropertyService(db)
    return await service.get_by_agent(current_user.id)


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = PropertyService(db)
    prop = await service.get_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    await service.record_view(property_id)
    return prop


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PropertyService(db)
    result = await service.create(payload, agent_id=current_user.id)
    from app.services.email_service import send_property_listed_email
    try:
        await send_property_listed_email(current_user.email, current_user.full_name, payload.title)
    except:
        pass
    return result


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    payload: PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PropertyService(db)
    prop = await service.get_by_id(property_id)
    if not prop or prop.agent_id != current_user.id:
        raise HTTPException(status_code=404, detail="Property not found")
    return await service.update(property_id, payload)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PropertyService(db)
    prop = await service.get_by_id(property_id)
    if not prop or prop.agent_id != current_user.id:
        raise HTTPException(status_code=404, detail="Property not found")
    await service.soft_delete(property_id)


