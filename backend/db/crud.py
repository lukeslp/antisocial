"""Database CRUD operations."""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import Search, Account, PlatformCheck

# Search operations
async def create_search(db: AsyncSession, username: str, platforms_total: int) -> Search:
    """Create a new search."""
    search = Search(username=username, platforms_total=platforms_total, status="running")
    db.add(search)
    await db.commit()
    await db.refresh(search)
    return search

async def get_search(db: AsyncSession, search_id: int) -> Optional[Search]:
    """Get a search by ID."""
    result = await db.execute(select(Search).where(Search.id == search_id))
    return result.scalar_one_or_none()

async def get_searches(db: AsyncSession, limit: int = 50) -> List[Search]:
    """Get recent searches."""
    result = await db.execute(select(Search).order_by(Search.created_at.desc()).limit(limit))
    return result.scalars().all()

async def update_search_progress(db: AsyncSession, search_id: int, checked: int, found: int):
    """Update search progress."""
    await db.execute(
        update(Search)
        .where(Search.id == search_id)
        .values(platforms_checked=checked, accounts_found=found)
    )
    await db.commit()

async def complete_search(db: AsyncSession, search_id: int):
    """Mark a search as completed."""
    await db.execute(
        update(Search)
        .where(Search.id == search_id)
        .values(status="completed", completed_at=datetime.utcnow())
    )
    await db.commit()

# Account operations
async def create_account(db: AsyncSession, **kwargs) -> Account:
    """Create a new discovered account."""
    account = Account(**kwargs)
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account

async def get_account(db: AsyncSession, account_id: int) -> Optional[Account]:
    """Get an account by ID."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    return result.scalar_one_or_none()

async def get_accounts_by_search(db: AsyncSession, search_id: int) -> List[Account]:
    """Get all accounts for a search."""
    result = await db.execute(
        select(Account).where(Account.search_id == search_id).order_by(Account.confidence_score.desc())
    )
    return result.scalars().all()

async def get_accounts_by_status(db: AsyncSession, status: str = None) -> List[Account]:
    """Get accounts filtered by status."""
    query = select(Account).order_by(Account.discovered_at.desc())
    if status and status != "all":
        query = query.where(Account.status == status)
    result = await db.execute(query)
    return result.scalars().all()

async def update_account_status(db: AsyncSession, account_id: int, status: str):
    """Update account status."""
    await db.execute(
        update(Account)
        .where(Account.id == account_id)
        .values(status=status, verified_at=datetime.utcnow())
    )
    await db.commit()

async def bulk_update_accounts(db: AsyncSession, account_ids: List[int], status: str):
    """Bulk update account statuses."""
    await db.execute(
        update(Account)
        .where(Account.id.in_(account_ids))
        .values(status=status, verified_at=datetime.utcnow())
    )
    await db.commit()

async def get_stats(db: AsyncSession) -> dict:
    """Get overall statistics."""
    searches = await db.execute(select(Search))
    all_searches = searches.scalars().all()
    
    accounts = await db.execute(select(Account))
    all_accounts = accounts.scalars().all()
    
    return {
        "total_searches": len(all_searches),
        "completed_searches": len([s for s in all_searches if s.status == "completed"]),
        "total_accounts": len(all_accounts),
        "confirmed_accounts": len([a for a in all_accounts if a.status == "confirmed"]),
        "deleted_accounts": len([a for a in all_accounts if a.status == "deleted"]),
        "pending_accounts": len([a for a in all_accounts if a.status == "pending"]),
    }
