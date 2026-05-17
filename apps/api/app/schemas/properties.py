from pydantic import BaseModel
from typing import Optional, List


class PropertyCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    type: str
    purpose: str
    state: str
    lga: str
    area: Optional[str] = ""
    price: int
    price_negotiable: bool = True
    title_type: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    toilets: Optional[int] = None
    size_sqm: Optional[float] = None
    parking_spaces: Optional[int] = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    status: Optional[str] = None
    area: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None


class PropertyResponse(BaseModel):
    id: str
    title: str
    type: str
    purpose: str
    state: str
    lga: str
    area: str
    price: int
    title_type: str
    status: str
    agent_id: str
    verification_status: str
    views: int
    inquiries: int
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    size_sqm: Optional[float] = None
    description: str = ""

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    data: List[PropertyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class PropertySearchQuery(BaseModel):
    state: Optional[str] = None
    lga: Optional[str] = None
    area: Optional[str] = None
    purpose: Optional[str] = None
    type: Optional[str] = None
    title_type: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    bedrooms: Optional[int] = None
    verified_only: bool = False
    risk_level: Optional[str] = None
    page: int = 1
    per_page: int = 20
    sort_by: str = "newest"