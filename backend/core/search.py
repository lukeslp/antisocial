"""Search orchestration for username verification across platforms."""
import asyncio
import logging
from typing import List, Optional, AsyncGenerator
from backend.core.registry import registry, Platform

logger = logging.getLogger(__name__)
from backend.core.whatsmyname import get_wmn_loader
from backend.platforms.base import VerificationResult
from backend.platforms.verifiers.api import APIVerifier
from backend.platforms.verifiers.browser import BrowserVerifier
from backend.platforms.verifiers.http import HTTPVerifier
from backend.platforms.verifiers.wmn import WMNVerifier
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

async def verify_wmn_site(wmn_site, username: str) -> VerificationResult:
    """Verify a WhatsMyName site."""
    verifier = WMNVerifier(wmn_site)
    return await verifier.verify(username)

async def search_username(
    username: str,
    tiers: Optional[List[int]] = None,
    min_confidence: int = 0,
    use_wmn: bool = False  # Disabled by default for speed - only check curated platforms
) -> AsyncGenerator[VerificationResult, None]:
    """
    Search for a username across all enabled platforms.
    
    Yields results as they come in for real-time updates.
    Prioritizes high-volume platforms for faster initial results.
    """
    # Get platforms from our registry
    platforms = registry.get_enabled_platforms(tiers)
    
    # Prioritize high-volume platforms (check these first)
    high_priority = ['github', 'reddit', 'twitter', 'instagram', 'facebook', 
                     'linkedin', 'youtube', 'tiktok', 'medium', 'bluesky']
    
    def get_priority(platform):
        name_lower = platform.name.lower()
        if name_lower in high_priority:
            return high_priority.index(name_lower)
        return 999  # Low priority for others
    
    platforms = sorted(platforms, key=get_priority)
    
    # Get WhatsMyName sites if enabled
    wmn_sites = []
    if use_wmn:
        wmn_loader = get_wmn_loader()
        # Get all WMN sites, excluding ones we already have in our registry
        registry_names = {p.name.lower() for p in platforms}
        all_wmn_sites = wmn_loader.get_all_sites()
        
        # Prioritize popular WMN sites
        wmn_priority = ['steam', 'gitlab', 'patreon', 'soundcloud', 'twitch',
                        'pinterest', 'tumblr', 'vimeo', 'behance', 'dribbble']
        
        def get_wmn_priority(site):
            name_lower = site.name.lower()
            if name_lower in wmn_priority:
                return wmn_priority.index(name_lower)
            return 999
        
        wmn_sites = [
            site for site in all_wmn_sites
            if site.name.lower() not in registry_names
        ]
        wmn_sites = sorted(wmn_sites, key=get_wmn_priority)
    
    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(settings.max_concurrent_requests)
    
    async def verify_with_semaphore(platform: Platform) -> VerificationResult:
        async with semaphore:
            return await verify_platform(platform, username)
    
    async def verify_wmn_with_semaphore(site) -> VerificationResult:
        async with semaphore:
            return await verify_wmn_site(site, username)
    
    # Create tasks for all platforms
    tasks = [verify_with_semaphore(p) for p in platforms]
    tasks.extend([verify_wmn_with_semaphore(s) for s in wmn_sites])
    
    # Yield ALL results as they complete (for accurate progress tracking)
    for coro in asyncio.as_completed(tasks):
        try:
            result = await coro
            # Yield all results, let caller decide what to do with them
            # This ensures progress counter updates for every platform checked
            yield result
        except Exception as e:
            # Log error but continue with other platforms
            logger.warning(f"Error verifying platform: {e}")
            continue

async def search_username_batch(
    username: str,
    tiers: Optional[List[int]] = None,
    min_confidence: int = 0,
    use_wmn: bool = True
) -> List[VerificationResult]:
    """
    Search for a username and return all results at once.
    """
    results = []
    async for result in search_username(username, tiers, min_confidence, use_wmn):
        results.append(result)
    return results
