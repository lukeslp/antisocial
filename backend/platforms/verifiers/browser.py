"""Browser-based verifier for Tier 2 platforms."""
from backend.platforms.base import BaseVerifier, VerificationResult
from backend.core.registry import Platform
from backend.config.settings import settings

# Note: Full browser verification requires Playwright
# For now, we use HTTP with enhanced headers as a fallback
import httpx

class BrowserVerifier(BaseVerifier):
    """Verifier using browser automation (Tier 2)."""
    
    async def verify(self, username: str) -> VerificationResult:
        """Verify username via browser-like request."""
        url = self.get_profile_url(username)
        
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout, follow_redirects=True) as client:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1",
                    "Upgrade-Insecure-Requests": "1",
                }
                
                response = await client.get(url, headers=headers)
                
                if response.status_code == 404:
                    return self._create_result(username, False, 0)
                
                if response.status_code != 200:
                    # Some platforms return 302 for non-existent users
                    if response.status_code in [301, 302, 303, 307, 308]:
                        final_url = str(response.url)
                        if "login" in final_url.lower() or "error" in final_url.lower():
                            return self._create_result(username, False, 0)
                    return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
                
                content = response.text.lower()
                
                # Platform-specific checks
                if self.platform.id == "twitter":
                    return self._check_twitter(username, content)
                elif self.platform.id == "instagram":
                    return self._check_instagram(username, content)
                elif self.platform.id == "tiktok":
                    return self._check_tiktok(username, content)
                elif self.platform.id == "facebook":
                    return self._check_facebook(username, content)
                elif self.platform.id == "linkedin":
                    return self._check_linkedin(username, content)
                elif self.platform.id == "youtube":
                    return self._check_youtube(username, content)
                elif self.platform.id == "twitch":
                    return self._check_twitch(username, content)
                else:
                    return self._check_generic(username, content)
                    
        except httpx.TimeoutException:
            return self._create_result(username, False, 0, error="Request timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))
    
    def _check_twitter(self, username: str, content: str) -> VerificationResult:
        """Check Twitter/X profile."""
        not_found = ["this account doesn't exist", "account suspended", "page doesn't exist"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_instagram(self, username: str, content: str) -> VerificationResult:
        """Check Instagram profile."""
        not_found = ["sorry, this page isn't available", "page not found"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_tiktok(self, username: str, content: str) -> VerificationResult:
        """Check TikTok profile."""
        not_found = ["couldn't find this account", "page not available"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_facebook(self, username: str, content: str) -> VerificationResult:
        """Check Facebook profile."""
        not_found = ["page not found", "content isn't available", "this content isn't available"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_linkedin(self, username: str, content: str) -> VerificationResult:
        """Check LinkedIn profile."""
        not_found = ["page not found", "profile not found", "this page doesn't exist"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_youtube(self, username: str, content: str) -> VerificationResult:
        """Check YouTube channel."""
        not_found = ["this page isn't available", "channel not found", "404"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_twitch(self, username: str, content: str) -> VerificationResult:
        """Check Twitch channel."""
        not_found = ["page not found", "sorry. unless you've got a time machine"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
    
    def _check_generic(self, username: str, content: str) -> VerificationResult:
        """Generic browser check."""
        not_found = ["not found", "doesn't exist", "does not exist", "404"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
