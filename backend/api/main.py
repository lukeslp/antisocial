"""FastAPI application for Account Discovery Tool."""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config.settings import settings
from backend.db.session import init_db, get_db
from backend.db import crud
from backend.core.registry import registry
from backend.core.search import search_username
from backend.api.schemas import (
    SearchCreate, SearchResponse, SearchListResponse,
    AccountResponse, AccountListResponse, AccountUpdate, BulkAccountUpdate,
    AccountFeedback, PlatformAccuracyListResponse,
    StatsResponse, PlatformResponse, PlatformListResponse,
    PlatformCheckResponse, PlatformCheckListResponse
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    await init_db()
    yield

app = FastAPI(
    title=settings.app_name,
    description="Find and manage old accounts across 30+ social media platforms",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - restrict to known origins for security
ALLOWED_ORIGINS = [
    "https://dr.eamer.dev",
    "https://d.reamwalker.com",
    "https://d.reamwalk.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# Background task for running searches
async def run_search_task(search_id: int, username: str, tiers: list, min_confidence: int, use_wmn: bool = False):
    """Background task to run a search."""
    from backend.db.session import async_session

    async with async_session() as db:
        checked = 0
        found = 0

        async for result in search_username(username, tiers, min_confidence, use_wmn=use_wmn):
            checked += 1

            # Record every platform check (found or not)
            await crud.create_platform_check(
                db,
                search_id=search_id,
                platform_id=result.platform_id,
                platform_name=result.platform_name,
                profile_url=result.profile_url,
                found=result.found and result.confidence_score >= min_confidence
            )

            # Only save accounts that meet criteria
            if result.found and result.confidence_score >= min_confidence:
                found += 1
                await crud.create_account(
                    db,
                    search_id=search_id,
                    platform_id=result.platform_id,
                    platform_name=result.platform_name,
                    username=result.username,
                    profile_url=result.profile_url,
                    display_name=result.display_name,
                    bio=result.bio,
                    avatar_url=result.avatar_url,
                    verification_method=result.verification_method,
                    confidence_score=result.confidence_score,
                )
            await crud.update_search_progress(db, search_id, checked, found)

        # Mark as completed (use actual checked count, not recalculated total)
        await crud.complete_search(db, search_id)

# API Routes

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "search": "POST /api/searches",
            "results": "GET /api/searches/{id}/results",
            "platforms": "GET /api/platforms"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.app_name}

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get overall statistics."""
    return await crud.get_stats(db)

# Search endpoints
@app.post("/api/searches", response_model=SearchResponse)
async def create_search(
    search_data: SearchCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new username search."""
    from backend.core.whatsmyname import get_wmn_loader

    platforms = registry.get_enabled_platforms(search_data.tiers)
    total_platforms = len(platforms)

    # If deep search enabled, add WhatsMyName platforms
    if search_data.deep_search:
        wmn_loader = get_wmn_loader()
        registry_names = {p.name.lower() for p in platforms}
        wmn_sites = [s for s in wmn_loader.get_all_sites() if s.name.lower() not in registry_names]
        total_platforms += len(wmn_sites)

    search = await crud.create_search(db, search_data.username, total_platforms)

    # Start background search task
    background_tasks.add_task(
        run_search_task,
        search.id,
        search_data.username,
        search_data.tiers,
        search_data.min_confidence,
        search_data.deep_search  # Pass deep_search as use_wmn
    )

    return search

@app.get("/api/searches", response_model=SearchListResponse)
async def list_searches(db: AsyncSession = Depends(get_db)):
    """List all searches."""
    searches = await crud.get_searches(db)
    return {"searches": searches}

@app.get("/api/searches/{search_id}", response_model=SearchResponse)
async def get_search(search_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific search."""
    search = await crud.get_search(db, search_id)
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    return search

@app.get("/api/searches/{search_id}/results", response_model=AccountListResponse)
async def get_search_results(search_id: int, db: AsyncSession = Depends(get_db)):
    """Get results for a specific search."""
    accounts = await crud.get_accounts_by_search(db, search_id)
    return {"accounts": accounts}

@app.get("/api/searches/{search_id}/checks", response_model=PlatformCheckListResponse)
async def get_platform_checks(
    search_id: int,
    found: bool = None,
    db: AsyncSession = Depends(get_db)
):
    """Get platform checks for a search (both found and not found)."""
    checks = await crud.get_platform_checks(db, search_id, found)
    return {"checks": checks}

# Account endpoints
@app.get("/api/accounts", response_model=AccountListResponse)
async def list_accounts(status: str = "all", db: AsyncSession = Depends(get_db)):
    """List all accounts, optionally filtered by status."""
    accounts = await crud.get_accounts_by_status(db, status)
    return {"accounts": accounts}

@app.get("/api/accounts/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific account."""
    account = await crud.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@app.patch("/api/accounts/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    update_data: AccountUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an account's status."""
    account = await crud.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    await crud.update_account_status(db, account_id, update_data.status)
    return await crud.get_account(db, account_id)

@app.post("/api/accounts/bulk-update")
async def bulk_update_accounts(
    update_data: BulkAccountUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Bulk update account statuses."""
    await crud.bulk_update_accounts(db, update_data.account_ids, update_data.status)
    return {"updated": len(update_data.account_ids)}

@app.post("/api/accounts/{account_id}/feedback", response_model=AccountResponse)
async def submit_account_feedback(
    account_id: int,
    feedback_data: AccountFeedback,
    db: AsyncSession = Depends(get_db)
):
    """Submit accuracy feedback for an account (1=correct, -1=incorrect, 0=clear)."""
    account = await crud.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if feedback_data.feedback not in [-1, 0, 1]:
        raise HTTPException(status_code=400, detail="Feedback must be -1, 0, or 1")

    await crud.update_account_feedback(db, account_id, feedback_data.feedback)
    return await crud.get_account(db, account_id)

@app.get("/api/accuracy", response_model=PlatformAccuracyListResponse)
async def get_platform_accuracy(db: AsyncSession = Depends(get_db)):
    """Get accuracy statistics per platform."""
    stats = await crud.get_platform_accuracy_stats(db)
    return {"platforms": stats}

# Platform endpoints
@app.get("/api/platforms", response_model=PlatformListResponse)
async def list_platforms():
    """List all supported platforms."""
    platforms = [
        PlatformResponse(
            id=p.id,
            name=p.name,
            category=p.category,
            tier=p.tier,
            enabled=p.enabled,
            url_template=p.url_template,
            verification_method=p.verification_method
        )
        for p in registry.all_platforms
    ]
    return {"platforms": platforms}
