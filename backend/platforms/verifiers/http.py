"""HTTP-based verifier for Tier 3 platforms."""
import httpx
from backend.platforms.base import BaseVerifier, VerificationResult
from backend.core.registry import Platform
from backend.config.settings import settings

class HTTPVerifier(BaseVerifier):
    """Verifier using HTTP requests with content analysis (Tier 3)."""
    
    # Common not-found indicators
    NOT_FOUND_INDICATORS = [
        "page not found",
        "user not found",
        "profile not found",
        "doesn't exist",
        "does not exist",
        "no user",
        "404",
        "not available",
        "account suspended",
        "account deleted",
    ]
    
    async def verify(self, username: str) -> VerificationResult:
        """Verify username via HTTP request and content analysis."""
        url = self.get_profile_url(username)
        
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout, follow_redirects=True) as client:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                }
                
                response = await client.get(url, headers=headers)
                
                # Check status code
                if response.status_code == 404:
                    return self._create_result(username, False, 0)
                
                if response.status_code != 200:
                    return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
                
                # Analyze content
                content = response.text.lower()
                
                # Check platform-specific not-found indicators
                indicators = self.platform.not_found_indicators or self.NOT_FOUND_INDICATORS
                for indicator in indicators:
                    if indicator.lower() in content:
                        return self._create_result(username, False, 0)
                
                # Check for username in page (basic validation)
                confidence = settings.http_confidence
                if username.lower() in content:
                    confidence += 10
                
                # Extract basic info from meta tags
                display_name = self._extract_meta(content, "og:title") or self._extract_meta(content, "twitter:title")
                bio = self._extract_meta(content, "og:description") or self._extract_meta(content, "description")
                avatar = self._extract_meta(content, "og:image") or self._extract_meta(content, "twitter:image")
                
                return self._create_result(
                    username=username,
                    found=True,
                    confidence=min(confidence, 90),
                    display_name=display_name,
                    bio=bio[:200] if bio else None,
                    avatar_url=avatar
                )
                
        except httpx.TimeoutException:
            return self._create_result(username, False, 0, error="Request timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))
    
    def _extract_meta(self, content: str, name: str) -> str:
        """Extract content from meta tags."""
        import re
        
        # Try property attribute
        pattern = rf'<meta[^>]*(?:property|name)=["\'](?:og:|twitter:)?{re.escape(name)}["\'][^>]*content=["\']([^"\']+)["\']'
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Try reversed order
        pattern = rf'<meta[^>]*content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\'](?:og:|twitter:)?{re.escape(name)}["\']'
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
