"""Pydantic schemas for API request/response models."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Search schemas
class SearchCreate(BaseModel):
    username: str
    tiers: Optional[List[int]] = [1, 2, 3]
    min_confidence: Optional[int] = 0
    deep_search: Optional[bool] = False  # Enable WhatsMyName (765+ platforms, slower)

class SearchResponse(BaseModel):
    id: int
    username: str
    status: str
    platforms_total: int
    platforms_checked: int
    accounts_found: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SearchListResponse(BaseModel):
    searches: List[SearchResponse]

# Account schemas
class AccountResponse(BaseModel):
    id: int
    search_id: int
    platform_id: str
    platform_name: str
    username: str
    profile_url: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    verification_method: str
    confidence_score: int
    status: str
    discovered_at: datetime
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AccountListResponse(BaseModel):
    accounts: List[AccountResponse]

class AccountUpdate(BaseModel):
    status: str

class BulkAccountUpdate(BaseModel):
    account_ids: List[int]
    status: str

# Stats schemas
class StatsResponse(BaseModel):
    total_searches: int
    completed_searches: int
    total_accounts: int
    confirmed_accounts: int
    deleted_accounts: int
    pending_accounts: int

# Platform schemas
class PlatformResponse(BaseModel):
    id: str
    name: str
    category: str
    tier: int
    enabled: bool
    url_template: str
    verification_method: str

class PlatformListResponse(BaseModel):
    platforms: List[PlatformResponse]
