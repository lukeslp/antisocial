"""Application settings and configuration."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Account Discovery Tool"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./data/accounts.db"
    
    # Paths
    base_dir: Path = Path(__file__).parent.parent.parent
    data_dir: Path = base_dir / "data"
    screenshots_dir: Path = data_dir / "screenshots"
    
    # Search settings
    max_concurrent_requests: int = 200  # High concurrency for fast parallel search
    request_timeout: int = 5  # Aggressive timeout - most platforms respond within 1-2 seconds
    
    # Verification thresholds
    api_confidence: int = 95
    browser_confidence: int = 85
    http_confidence: int = 70
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra environment variables

settings = Settings()

# Ensure directories exist
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.screenshots_dir.mkdir(parents=True, exist_ok=True)
