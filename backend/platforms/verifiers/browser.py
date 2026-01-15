"""Browser-based verifier for Tier 2 platforms using Playwright."""
import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from backend.platforms.base import BaseVerifier, VerificationResult
from backend.core.registry import Platform
from backend.config.settings import settings

# Shared browser instance for efficiency
_browser = None
_playwright = None

async def get_browser():
    """Get or create shared browser instance."""
    global _browser, _playwright
    if _browser is None or not _browser.is_connected():
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
    return _browser

class BrowserVerifier(BaseVerifier):
    """Verifier using real browser automation (Tier 2)."""

    async def verify(self, username: str) -> VerificationResult:
        """Verify username via real browser."""
        url = self.get_profile_url(username)

        try:
            browser = await get_browser()
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 720}
            )
            page = await context.new_page()

            try:
                # Navigate with shorter timeout
                await page.goto(url, timeout=settings.request_timeout * 1000, wait_until="domcontentloaded")

                # Wait a bit for JS to render
                await asyncio.sleep(1)

                # Get page content
                content = await page.content()
                content_lower = content.lower()
                final_url = page.url.lower()

                # Check for redirects to login/error pages
                if "login" in final_url or "error" in final_url or "/404" in final_url:
                    return self._create_result(username, False, 0)

                # Platform-specific checks
                result = await self._check_platform(username, content_lower, page)
                return result

            finally:
                await context.close()

        except PlaywrightTimeout:
            return self._create_result(username, False, 0, error="Browser timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))

    async def _check_platform(self, username: str, content: str, page) -> VerificationResult:
        """Check platform-specific indicators."""
        platform_id = self.platform.id

        if platform_id == "twitter":
            return await self._check_twitter(username, content, page)
        elif platform_id == "instagram":
            return await self._check_instagram(username, content, page)
        elif platform_id == "tiktok":
            return await self._check_tiktok(username, content, page)
        elif platform_id == "facebook":
            return await self._check_facebook(username, content, page)
        elif platform_id == "linkedin":
            return await self._check_linkedin(username, content, page)
        elif platform_id == "youtube":
            return await self._check_youtube(username, content, page)
        elif platform_id == "twitch":
            return await self._check_twitch(username, content, page)
        elif platform_id == "pinterest":
            return await self._check_pinterest(username, content, page)
        else:
            return self._check_generic(username, content)

    async def _check_twitter(self, username: str, content: str, page) -> VerificationResult:
        """Check Twitter/X profile."""
        not_found = ["this account doesn't exist", "account suspended", "hmm...this page doesn't exist", "something went wrong"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        # Look for profile indicators
        if f"@{username.lower()}" in content or f'"screen_name":"{username}"' in content.lower():
            # Try to extract display name
            display_name = None
            try:
                title = await page.title()
                if "(" in title and ")" in title:
                    display_name = title.split("(")[0].strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    async def _check_instagram(self, username: str, content: str, page) -> VerificationResult:
        """Check Instagram profile."""
        # Instagram blocks headless browsers - check if redirected to login
        final_url = page.url.lower()
        if "/accounts/login" in final_url or "challenge" in final_url:
            return self._create_result(username, False, 0, error="Instagram blocks automated access")

        # Very short content means page didn't load (JS redirect)
        if len(content) < 1000:
            return self._create_result(username, False, 0, error="Page blocked")

        not_found = ["sorry, this page isn't available", "page not found", "the link you followed may be broken"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        if username.lower() in content:
            display_name = None
            try:
                title = await page.title()
                if "(" in title:
                    display_name = title.split("(")[0].strip()
                elif " • " in title:
                    display_name = title.split(" • ")[0].strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    async def _check_tiktok(self, username: str, content: str, page) -> VerificationResult:
        """Check TikTok profile."""
        # TikTok bundles all error strings in JS, so check positive indicators first
        try:
            title = await page.title()
            # Valid profile title format: "Display Name (@username) | TikTok"
            if f"@{username.lower()}" in title.lower() and "| tiktok" in title.lower():
                display_name = title.split("(")[0].strip() if "(" in title else None
                return self._create_result(username, True, settings.browser_confidence, display_name=display_name)
        except:
            pass

        # Check URL - if redirected away from profile, account doesn't exist
        final_url = page.url.lower()
        if "/foryou" in final_url or "notfound" in final_url:
            return self._create_result(username, False, 0)

        # Fallback: username in content and reasonable content length
        if (username.lower() in content or f"@{username.lower()}" in content) and len(content) > 10000:
            return self._create_result(username, True, settings.browser_confidence)

        return self._create_result(username, False, 0)

    async def _check_facebook(self, username: str, content: str, page) -> VerificationResult:
        """Check Facebook profile using WhatsMyName detection patterns."""
        # WhatsMyName pattern: __isProfile exists = profile found
        # <title>Facebook</title> (generic) = no profile
        try:
            title = await page.title()
        except:
            title = ""

        # Check for generic Facebook title (no profile)
        if title == "Facebook" or "<title>Facebook</title>" in content:
            return self._create_result(username, False, 0)

        # Check for profile indicator in page data
        if "__isProfile" in content:
            display_name = None
            if " | " in title:
                display_name = title.split(" | ")[0].strip()
            elif " - " in title:
                display_name = title.split(" - ")[0].strip()
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        # Fallback checks
        not_found = ["page not found", "content isn't available", "this content isn't available"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        if username.lower() in content and len(content) > 5000:
            return self._create_result(username, True, settings.browser_confidence)

        return self._create_result(username, False, 0)

    async def _check_linkedin(self, username: str, content: str, page) -> VerificationResult:
        """Check LinkedIn profile."""
        not_found = ["page not found", "profile not found", "this page doesn't exist", "this linkedin page isn't available"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        # LinkedIn often requires login
        if "join linkedin" in content or "sign in" in content:
            # Check if we still see profile info
            if username.lower() not in content:
                return self._create_result(username, False, 0, error="Login wall")

        if username.lower() in content:
            display_name = None
            try:
                title = await page.title()
                if " | " in title:
                    display_name = title.split(" | ")[0].strip()
                elif " - " in title:
                    display_name = title.split(" - ")[0].strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    async def _check_youtube(self, username: str, content: str, page) -> VerificationResult:
        """Check YouTube channel."""
        not_found = ["this page isn't available", "this channel does not exist", "404 not found"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        if username.lower() in content or f"@{username.lower()}" in content:
            display_name = None
            try:
                title = await page.title()
                if " - YouTube" in title:
                    display_name = title.replace(" - YouTube", "").strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    async def _check_twitch(self, username: str, content: str, page) -> VerificationResult:
        """Check Twitch channel."""
        not_found = ["page not found", "sorry. unless you've got a time machine", "this channel is unavailable"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        if username.lower() in content:
            display_name = None
            try:
                title = await page.title()
                if " - Twitch" in title:
                    display_name = title.replace(" - Twitch", "").strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    async def _check_pinterest(self, username: str, content: str, page) -> VerificationResult:
        """Check Pinterest profile."""
        not_found = ["page not found", "sorry, we couldn't find that page"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)

        if username.lower() in content:
            display_name = None
            try:
                title = await page.title()
                if " (" in title:
                    display_name = title.split(" (")[0].strip()
            except:
                pass
            return self._create_result(username, True, settings.browser_confidence, display_name=display_name)

        return self._create_result(username, False, 0)

    def _check_generic(self, username: str, content: str) -> VerificationResult:
        """Generic browser check."""
        not_found = ["not found", "doesn't exist", "does not exist", "404", "page not available"]
        for indicator in not_found:
            if indicator in content:
                return self._create_result(username, False, 0)
        if username.lower() in content:
            return self._create_result(username, True, settings.browser_confidence)
        return self._create_result(username, False, 0)
