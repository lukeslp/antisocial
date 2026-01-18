"""WhatsMyName-based verifier for maximum coverage and accuracy."""
import re
import httpx
from backend.platforms.base import BaseVerifier, VerificationResult
from backend.core.whatsmyname import WMNSite, get_wmn_loader
from backend.config.settings import settings

class WMNVerifier(BaseVerifier):
    """Verifier using WhatsMyName detection patterns."""
    
    def __init__(self, wmn_site: WMNSite):
        """Initialize with WhatsMyName site definition."""
        self.wmn_site = wmn_site
        # Create a minimal platform object for BaseVerifier
        class MinimalPlatform:
            def __init__(self, site: WMNSite):
                self.id = site.id
                self.name = site.name
                self.url_template = site.uri_pretty or site.uri_check
                self.category = site.category
        
        # Don't call super().__init__() since we're not using the registry
        self.platform = MinimalPlatform(wmn_site)
    
    async def verify(self, username: str) -> VerificationResult:
        """Verify username using WhatsMyName patterns."""
        # Replace {account} placeholder with username
        url = self.wmn_site.uri_check.replace('{account}', username)
        
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout, follow_redirects=True) as client:
                # Use custom headers if specified
                headers = self.wmn_site.headers or {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                
                response = await client.get(url, headers=headers)
                content = response.text
                
                # Check for account existence using WhatsMyName patterns
                found = self._check_existence(response.status_code, content)
                
                if found:
                    # Calculate confidence based on pattern strength
                    confidence = self._calculate_confidence(response.status_code, content)
                    profile_url = self.wmn_site.uri_pretty or self.wmn_site.uri_check
                    profile_url = profile_url.replace('{account}', username)
                    
                    return VerificationResult(
                        platform_id=self.platform.id,
                        platform_name=self.platform.name,
                        username=username,
                        found=True,
                        confidence_score=confidence,
                        profile_url=profile_url,
                        verification_method="wmn",
                        display_name=None,
                        avatar_url=None
                    )
                else:
                    return self._create_result(username, False, 0)
                    
        except httpx.TimeoutException:
            return self._create_result(username, False, 0, error="Request timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))
    
    def _check_existence(self, status_code: int, content: str) -> bool:
        """Check if account exists using WhatsMyName patterns."""
        # First check for "missing" indicators (account doesn't exist)
        if self.wmn_site.m_code and status_code == self.wmn_site.m_code:
            return False
        
        if self.wmn_site.m_string:
            # Check if missing string is present
            if self._string_match(self.wmn_site.m_string, content):
                return False
        
        # Then check for "exists" indicators
        if self.wmn_site.e_code and status_code != self.wmn_site.e_code:
            return False
        
        if self.wmn_site.e_string:
            # Check if exists string is present
            if not self._string_match(self.wmn_site.e_string, content):
                return False
        
        # If we passed all checks, account likely exists
        return True
    
    def _string_match(self, pattern: str, content: str) -> bool:
        """Match string pattern in content (supports regex)."""
        try:
            # Try as regex first
            return bool(re.search(pattern, content, re.IGNORECASE))
        except re.error:
            # Fall back to simple string matching
            return pattern.lower() in content.lower()
    
    def _calculate_confidence(self, status_code: int, content: str) -> int:
        """Calculate confidence score based on pattern matches."""
        confidence = 70  # Base confidence for WhatsMyName patterns
        
        # Boost confidence if both status code and string match
        if self.wmn_site.e_code and status_code == self.wmn_site.e_code:
            confidence += 10
        
        if self.wmn_site.e_string and self._string_match(self.wmn_site.e_string, content):
            confidence += 15
        
        # Cap at 95 (same as API tier)
        return min(confidence, 95)
    
    def _create_result(self, username: str, found: bool, confidence: int, error: str = None) -> VerificationResult:
        """Create verification result."""
        # Always provide profile_url (required by database)
        profile_url = self.wmn_site.uri_pretty or self.wmn_site.uri_check
        profile_url = profile_url.replace('{account}', username)

        return VerificationResult(
            platform_id=self.platform.id,
            platform_name=self.platform.name,
            username=username,
            found=found,
            confidence_score=confidence,
            profile_url=profile_url,
            verification_method="wmn",
            display_name=None,
            avatar_url=None,
            error=error
        )
