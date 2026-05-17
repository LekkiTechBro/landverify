from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import Property
from app.schemas.properties import PropertyCreate, PropertyUpdate, PropertySearchQuery
import uuid


class PropertyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, payload: PropertyCreate, agent_id: str) -> Property:
        prop = Property(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            title=payload.title,
            description=payload.description or "",
            type=payload.type,
            purpose=payload.purpose,
            state=payload.state,
            lga=payload.lga,
            area=payload.area or "",
            price=payload.price,
            price_negotiable=payload.price_negotiable,
            title_type=payload.title_type,
            status="available",
            verification_status="unverified",
            photos=[],
            views=0,
            inquiries=0,
        )
        self.db.add(prop)
        await self.db.commit()
        await self.db.refresh(prop)
        return prop

    async def get_by_id(self, property_id: str) -> Optional[Property]:
        result = await self.db.execute(
            select(Property).where(
                Property.id == property_id,
                Property.deleted_at == None,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_agent(self, agent_id: str) -> list:
        result = await self.db.execute(
            select(Property).where(
                Property.agent_id == agent_id,
                Property.deleted_at == None,
            ).order_by(Property.created_at.desc())
        )
        return result.scalars().all()

    async def search(self, query: PropertySearchQuery) -> dict:
        stmt = select(Property).where(Property.deleted_at == None)
        if query.state:
            stmt = stmt.where(Property.state == query.state)
        if query.lga:
            stmt = stmt.where(Property.lga == query.lga)
        if query.purpose:
            stmt = stmt.where(Property.purpose == query.purpose)
        if query.type:
            stmt = stmt.where(Property.type == query.type)
        if query.min_price:
            stmt = stmt.where(Property.price >= query.min_price)
        if query.max_price:
            stmt = stmt.where(Property.price <= query.max_price)
        if query.verified_only:
            stmt = stmt.where(Property.verification_status == "fully_verified")

        count_result = await self.db.execute(
            select(func.count()).select_from(stmt.subquery())
        )
        total = count_result.scalar()

        offset = (query.page - 1) * query.per_page
        stmt = stmt.offset(offset).limit(query.per_page)
        result = await self.db.execute(stmt)
        properties = result.scalars().all()

        return {
            "data": properties,
            "total": total,
            "page": query.page,
            "per_page": query.per_page,
            "total_pages": (total + query.per_page - 1) // query.per_page,
        }

    async def update(self, property_id: str, payload: PropertyUpdate) -> Optional[Property]:
        prop = await self.get_by_id(property_id)
        if not prop:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prop, field, value)
        await self.db.commit()
        await self.db.refresh(prop)
        return prop

    async def soft_delete(self, property_id: str) -> None:
        from datetime import datetime, timezone
        prop = await self.get_by_id(property_id)
        if prop:
            prop.deleted_at = datetime.now(timezone.utc)
            await self.db.commit()

    async def record_view(self, property_id: str) -> None:
        prop = await self.get_by_id(property_id)
        if prop:
            prop.views += 1
            await self.db.commit()

    async def upload_photos(self, property_id: str, files: list, agent_id: str) -> dict:
        return {"message": "Photo upload coming in Phase 2", "photos": []}