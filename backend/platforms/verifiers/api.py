"""API-based verifier for Tier 1 platforms."""
import httpx
from backend.platforms.base import BaseVerifier, VerificationResult
from backend.core.registry import Platform
from backend.config.settings import settings

class APIVerifier(BaseVerifier):
    """Verifier using official platform APIs (Tier 1)."""
    
    async def verify(self, username: str) -> VerificationResult:
        """Verify username via API call."""
        if not self.platform.api_endpoint:
            return self._create_result(username, False, 0, error="No API endpoint configured")
        
        url = self.platform.api_endpoint.format(username=username)
        
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                headers = {"User-Agent": "AccountDiscovery/1.0"}
                
                # Platform-specific handling
                if self.platform.id == "github":
                    return await self._verify_github(client, url, username)
                elif self.platform.id == "reddit":
                    return await self._verify_reddit(client, url, username)
                elif self.platform.id == "bluesky":
                    return await self._verify_bluesky(client, url, username)
                elif self.platform.id == "medium":
                    return await self._verify_medium(client, url, username)
                elif self.platform.id == "tiktok":
                    return await self._verify_tiktok(client, username)
                elif self.platform.id == "twitter":
                    return await self._verify_twitter(client, username)
                elif self.platform.id == "npm":
                    return await self._verify_npm(client, url, username)
                elif self.platform.id == "vimeo":
                    return await self._verify_vimeo(client, url, username)
                else:
                    return await self._verify_generic(client, url, username, headers)
                    
        except httpx.TimeoutException:
            return self._create_result(username, False, 0, error="Request timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))
    
    async def _verify_github(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify GitHub user via API with username variations."""
        from backend.core.username_variations import generate_variations
        
        variations = generate_variations(username, "github")
        
        for variant in variations:
            variant_url = url.replace(username, variant)
            try:
                response = await client.get(variant_url, headers={"Accept": "application/vnd.github.v3+json"})
                
                if response.status_code == 200:
                    data = response.json()
                    return self._create_result(
                        username=variant,
                        found=True,
                        confidence=100,
                        display_name=data.get("name"),
                        bio=data.get("bio"),
                        avatar_url=data.get("avatar_url")
                    )
                elif response.status_code == 404:
                    continue
            except Exception:
                continue
        
        return self._create_result(username, False, 0)
    
    async def _verify_reddit(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Reddit user via API with username variations."""
        from backend.core.username_variations import generate_variations
        
        variations = generate_variations(username, "reddit")
        headers = {"User-Agent": "AccountDiscovery/1.0"}
        
        for variant in variations:
            variant_url = url.replace(username, variant)
            try:
                response = await client.get(variant_url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("data", {})
                    return self._create_result(
                        username=variant,
                        found=True,
                        confidence=100,
                        display_name=user_data.get("subreddit", {}).get("title"),
                        bio=user_data.get("subreddit", {}).get("public_description"),
                        avatar_url=user_data.get("icon_img", "").split("?")[0] if user_data.get("icon_img") else None
                    )
                elif response.status_code == 404:
                    continue
            except Exception:
                continue
        
        return self._create_result(username, False, 0)
    
    async def _verify_bluesky(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Bluesky user via API with domain handle support."""
        from backend.core.username_variations import generate_variations
        
        # Try username variations (including domain handles like username.bsky.social)
        variations = generate_variations(username, "bluesky")
        
        for variant in variations:
            variant_url = url.replace(username, variant)
            try:
                response = await client.get(variant_url)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._create_result(
                        username=variant,
                        found=True,
                        confidence=100,
                        display_name=data.get("displayName"),
                        bio=data.get("description"),
                        avatar_url=data.get("avatar")
                    )
                elif response.status_code == 400:
                    # Profile not found, try next variation
                    continue
            except Exception:
                # Error with this variation, try next
                continue
        
        # No variations found
        return self._create_result(username, False, 0)
    
    async def _verify_medium(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Medium user."""
        response = await client.get(url, follow_redirects=True)
        
        if response.status_code == 200:
            # Medium returns JSON with a prefix
            text = response.text
            if text.startswith("])}while(1);</x>"):
                text = text[16:]
                try:
                    import json
                    data = json.loads(text)
                    user = data.get("payload", {}).get("user", {})
                    return self._create_result(
                        username=username,
                        found=True,
                        confidence=95,
                        display_name=user.get("name"),
                        bio=user.get("bio"),
                        avatar_url=user.get("imageId")
                    )
                except:
                    pass
            return self._create_result(username, True, 85)
        elif response.status_code == 404:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
    
    async def _verify_tiktok(self, client: httpx.AsyncClient, username: str) -> VerificationResult:
        """Verify TikTok user via oEmbed API."""
        # TikTok oEmbed API - no auth required
        url = f"https://www.tiktok.com/oembed?url=https://www.tiktok.com/@{username}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

        try:
            response = await client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                if "author_url" in data:
                    return self._create_result(
                        username=username,
                        found=True,
                        confidence=100,
                        display_name=data.get("author_name"),
                        bio=data.get("title")
                    )
            elif response.status_code == 400:
                # Account doesn't exist
                return self._create_result(username, False, 0)
        except Exception:
            pass

        return self._create_result(username, False, 0)

    async def _verify_twitter(self, client: httpx.AsyncClient, username: str) -> VerificationResult:
        """Verify Twitter/X user via username availability API."""
        url = f"https://api.x.com/i/users/username_available.json?username={username}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

        try:
            response = await client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                # "taken" means account exists, "available" means it doesn't
                if data.get("reason") == "taken":
                    return self._create_result(
                        username=username,
                        found=True,
                        confidence=100
                    )
                elif data.get("reason") == "available":
                    return self._create_result(username, False, 0)
        except Exception:
            pass

        return self._create_result(username, False, 0)

    async def _verify_npm(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify npm user via CouchDB user registry API."""
        headers = {"User-Agent": "AccountDiscovery/1.0", "Accept": "application/json"}
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return self._create_result(
                    username=username,
                    found=True,
                    confidence=100,
                    display_name=data.get("name") or data.get("fullname"),
                    bio=data.get("twitterUsername") or data.get("github"),
                    avatar_url=data.get("avatarUrl")
                )
            elif response.status_code == 404:
                return self._create_result(username, False, 0)
            else:
                return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))

    async def _verify_vimeo(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Vimeo user via v2 API (avoids bot detection on direct page requests)."""
        headers = {"User-Agent": "AccountDiscovery/1.0"}
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return self._create_result(
                    username=username,
                    found=True,
                    confidence=100,
                    display_name=data.get("display_name"),
                    bio=data.get("bio"),
                    avatar_url=data.get("portrait_medium")
                )
            elif response.status_code == 404:
                return self._create_result(username, False, 0)
            else:
                return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))

    async def _verify_generic(self, client: httpx.AsyncClient, url: str, username: str, headers: dict) -> VerificationResult:
        """Generic API verification."""
        response = await client.get(url, headers=headers)

        if response.status_code == 200:
            return self._create_result(username, True, settings.api_confidence)
        elif response.status_code == 404:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
