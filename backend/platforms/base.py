"""Base verifier class for platform verification."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from backend.core.registry import Platform

@dataclass
class VerificationResult:
    """Result of a platform verification."""
    platform_id: str
    platform_name: str
    username: str
    found: bool
    confidence_score: int
    profile_url: str
    verification_method: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    error: Optional[str] = None

class BaseVerifier(ABC):
    """Abstract base class for platform verifiers."""
    
    def __init__(self, platform: Platform):
        self.platform = platform
    
    def get_profile_url(self, username: str) -> str:
        """Generate the profile URL for a username."""
        return self.platform.url_template.format(username=username)
    
    @abstractmethod
    async def verify(self, username: str) -> VerificationResult:
        """Verify if a username exists on this platform."""
        pass
    
    def _create_result(
        self,
        username: str,
        found: bool,
        confidence: int,
        display_name: str = None,
        bio: str = None,
        avatar_url: str = None,
        error: str = None
    ) -> VerificationResult:
        """Helper to create a verification result."""
        return VerificationResult(
            platform_id=self.platform.id,
            platform_name=self.platform.name,
            username=username,
            found=found,
            confidence_score=confidence if found else 0,
            profile_url=self.get_profile_url(username),
            verification_method=self.platform.verification_method,
            display_name=display_name,
            bio=bio,
            avatar_url=avatar_url,
            error=error
        )
