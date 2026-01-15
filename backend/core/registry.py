"""Platform registry - loads and manages platform configurations."""
from pathlib import Path
from typing import Dict, List, Optional
import yaml
from dataclasses import dataclass

@dataclass
class Platform:
    """Platform configuration."""
    id: str
    name: str
    category: str
    tier: int
    enabled: bool
    url_template: str
    verification_method: str
    api_endpoint: Optional[str] = None
    not_found_indicators: Optional[List[str]] = None

class PlatformRegistry:
    """Registry of all supported platforms."""
    
    def __init__(self):
        self._platforms: Dict[str, Platform] = {}
        self._load_platforms()
    
    def _load_platforms(self):
        """Load platforms from YAML configuration."""
        config_path = Path(__file__).parent.parent / "config" / "platforms.yaml"
        
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
        
        for platform_id, config in data.get('platforms', {}).items():
            self._platforms[platform_id] = Platform(
                id=platform_id,
                name=config['name'],
                category=config['category'],
                tier=config['tier'],
                enabled=config.get('enabled', True),
                url_template=config['url_template'],
                verification_method=config['verification_method'],
                api_endpoint=config.get('api_endpoint'),
                not_found_indicators=config.get('not_found_indicators'),
            )
    
    def get_platform(self, platform_id: str) -> Optional[Platform]:
        """Get a platform by ID."""
        return self._platforms.get(platform_id)
    
    def get_enabled_platforms(self, tiers: Optional[List[int]] = None) -> List[Platform]:
        """Get all enabled platforms, optionally filtered by tier."""
        platforms = [p for p in self._platforms.values() if p.enabled]
        if tiers:
            platforms = [p for p in platforms if p.tier in tiers]
        return sorted(platforms, key=lambda p: (p.tier, p.name))
    
    def get_platforms_by_tier(self, tier: int) -> List[Platform]:
        """Get all enabled platforms for a specific tier."""
        return [p for p in self._platforms.values() if p.enabled and p.tier == tier]
    
    @property
    def all_platforms(self) -> List[Platform]:
        """Get all platforms."""
        return list(self._platforms.values())
    
    @property
    def enabled_count(self) -> int:
        """Get count of enabled platforms."""
        return len([p for p in self._platforms.values() if p.enabled])

# Global registry instance
registry = PlatformRegistry()
