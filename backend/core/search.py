"""Search orchestration - manages the search process across platforms."""
import asyncio
from typing import List, Optional, AsyncGenerator
from backend.core.registry import registry, Platform
from backend.platforms.base import VerificationResult
from backend.platforms.verifiers.api import APIVerifier
from backend.platforms.verifiers.browser import BrowserVerifier
from backend.platforms.verifiers.http import HTTPVerifier
from backend.config.settings import settings

def get_verifier(platform: Platform):
    """Get the appropriate verifier for a platform."""
    if platform.verification_method == "api":
        return APIVerifier(platform)
    elif platform.verification_method == "browser":
        return BrowserVerifier(platform)
    else:
        return HTTPVerifier(platform)

async def verify_platform(platform: Platform, username: str) -> VerificationResult:
    """Verify a single platform."""
    verifier = get_verifier(platform)
    return await verifier.verify(username)

async def search_username(
    username: str,
    tiers: Optional[List[int]] = None,
    min_confidence: int = 0
) -> AsyncGenerator[VerificationResult, None]:
    """
    Search for a username across all enabled platforms.
    
    Yields results as they come in for real-time updates.
    """
    platforms = registry.get_enabled_platforms(tiers)
    
    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(settings.max_concurrent_requests)
    
    async def verify_with_semaphore(platform: Platform) -> VerificationResult:
        async with semaphore:
            return await verify_platform(platform, username)
    
    # Create tasks for all platforms
    tasks = [verify_with_semaphore(p) for p in platforms]
    
    # Yield results as they complete
    for coro in asyncio.as_completed(tasks):
        result = await coro
        if result.found and result.confidence_score >= min_confidence:
            yield result

async def search_username_batch(
    username: str,
    tiers: Optional[List[int]] = None,
    min_confidence: int = 0
) -> List[VerificationResult]:
    """
    Search for a username and return all results at once.
    """
    results = []
    async for result in search_username(username, tiers, min_confidence):
        results.append(result)
    return results
