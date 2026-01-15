"""Pydantic schemas for API request/response models."""
import re
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

# Search schemas
class SearchCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=255)
    tiers: Optional[List[int]] = Field(default=[1, 2, 3])
    min_confidence: Optional[int] = Field(default=0, ge=0, le=100)
    deep_search: Optional[bool] = False  # Enable WhatsMyName (765+ platforms, slower)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Username cannot be empty or whitespace')
        # Allow alphanumeric, underscore, dash, dot (common across platforms)
        if not re.match(r'^[a-zA-Z0-9._-]+$', v):
            raise ValueError('Username contains invalid characters')
        return v

    @field_validator('tiers')
    @classmethod
    def validate_tiers(cls, v: List[int]) -> List[int]:
        if not v:
            raise ValueError('At least one tier must be selected')
        if not all(t in [1, 2, 3] for t in v):
            raise ValueError('Tiers must be 1, 2, or 3')
        return v

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
    accuracy_feedback: int = 0  # 1 = thumbs up, -1 = thumbs down, 0 = no feedback
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

class AccountFeedback(BaseModel):
    feedback: int  # 1 = thumbs up, -1 = thumbs down, 0 = clear

class PlatformAccuracyStats(BaseModel):
    platform_id: str
    platform_name: str
    total: int
    thumbs_up: int
    thumbs_down: int
    no_feedback: int
    accuracy_rate: float

class PlatformAccuracyListResponse(BaseModel):
    platforms: List[PlatformAccuracyStats]

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


# Platform check schemas (for showing checked platforms including negatives)
class PlatformCheckResponse(BaseModel):
    id: int
    search_id: int
    platform_id: str
    platform_name: str
    profile_url: str
    found: bool
    checked_at: datetime

    class Config:
        from_attributes = True


class PlatformCheckListResponse(BaseModel):
    checks: List[PlatformCheckResponse]
