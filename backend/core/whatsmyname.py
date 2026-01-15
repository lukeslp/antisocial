"""WhatsMyName data loader and integration."""
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class WMNSite:
    """WhatsMyName site definition."""
    name: str
    uri_check: str
    uri_pretty: Optional[str]
    e_code: int  # Expected code for existing account
    e_string: Optional[str]  # Expected string for existing account
    m_code: int  # Missing code for non-existent account
    m_string: Optional[str]  # Missing string for non-existent account
    known: List[str]  # Known usernames for testing
    category: str
    headers: Optional[Dict[str, str]] = None
    
    @property
    def id(self) -> str:
        """Generate platform ID from name."""
        return self.name.lower().replace(' ', '_').replace('/', '_')

class WhatsMyNameLoader:
    """Loader for WhatsMyName data."""
    
    def __init__(self, data_path: Optional[Path] = None):
        """Initialize loader."""
        if data_path is None:
            data_path = Path(__file__).parent.parent / "config" / "wmn-data.json"
        
        self.data_path = data_path
        self.sites: Dict[str, WMNSite] = {}
        self._load_data()
    
    def _load_data(self):
        """Load WhatsMyName data from JSON file."""
        with open(self.data_path, 'r') as f:
            data = json.load(f)
        
        for site_data in data.get('sites', []):
            try:
                site = WMNSite(
                    name=site_data['name'],
                    uri_check=site_data['uri_check'],
                    uri_pretty=site_data.get('uri_pretty'),
                    e_code=site_data.get('e_code', 200),
                    e_string=site_data.get('e_string'),
                    m_code=site_data.get('m_code', 404),
                    m_string=site_data.get('m_string'),
                    known=site_data.get('known', []),
                    category=site_data.get('cat', 'other'),
                    headers=site_data.get('headers')
                )
                self.sites[site.id] = site
            except KeyError as e:
                # Skip sites with missing required fields
                continue
    
    def get_site(self, site_id: str) -> Optional[WMNSite]:
        """Get site by ID."""
        return self.sites.get(site_id)
    
    def get_all_sites(self) -> List[WMNSite]:
        """Get all sites."""
        return list(self.sites.values())
    
    def get_sites_by_category(self, category: str) -> List[WMNSite]:
        """Get sites by category."""
        return [site for site in self.sites.values() if site.category == category]
    
    def search_sites(self, query: str) -> List[WMNSite]:
        """Search sites by name."""
        query = query.lower()
        return [site for site in self.sites.values() if query in site.name.lower()]

# Global loader instance
_loader: Optional[WhatsMyNameLoader] = None

def get_wmn_loader() -> WhatsMyNameLoader:
    """Get global WhatsMyName loader instance."""
    global _loader
    if _loader is None:
        _loader = WhatsMyNameLoader()
    return _loader
