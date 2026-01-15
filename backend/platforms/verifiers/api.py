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
                else:
                    return await self._verify_generic(client, url, username, headers)
                    
        except httpx.TimeoutException:
            return self._create_result(username, False, 0, error="Request timeout")
        except Exception as e:
            return self._create_result(username, False, 0, error=str(e))
    
    async def _verify_github(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify GitHub user via API."""
        response = await client.get(url, headers={"Accept": "application/vnd.github.v3+json"})
        
        if response.status_code == 200:
            data = response.json()
            return self._create_result(
                username=username,
                found=True,
                confidence=100,
                display_name=data.get("name"),
                bio=data.get("bio"),
                avatar_url=data.get("avatar_url")
            )
        elif response.status_code == 404:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
    
    async def _verify_reddit(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Reddit user via API."""
        headers = {"User-Agent": "AccountDiscovery/1.0"}
        response = await client.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {})
            return self._create_result(
                username=username,
                found=True,
                confidence=100,
                display_name=user_data.get("subreddit", {}).get("title"),
                bio=user_data.get("subreddit", {}).get("public_description"),
                avatar_url=user_data.get("icon_img", "").split("?")[0] if user_data.get("icon_img") else None
            )
        elif response.status_code == 404:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
    
    async def _verify_bluesky(self, client: httpx.AsyncClient, url: str, username: str) -> VerificationResult:
        """Verify Bluesky user via API."""
        response = await client.get(url)
        
        if response.status_code == 200:
            data = response.json()
            return self._create_result(
                username=username,
                found=True,
                confidence=100,
                display_name=data.get("displayName"),
                bio=data.get("description"),
                avatar_url=data.get("avatar")
            )
        elif response.status_code == 400:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
    
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
    
    async def _verify_generic(self, client: httpx.AsyncClient, url: str, username: str, headers: dict) -> VerificationResult:
        """Generic API verification."""
        response = await client.get(url, headers=headers)
        
        if response.status_code == 200:
            return self._create_result(username, True, settings.api_confidence)
        elif response.status_code == 404:
            return self._create_result(username, False, 0)
        else:
            return self._create_result(username, False, 0, error=f"HTTP {response.status_code}")
