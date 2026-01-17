# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
# Development
cd /home/coolhand/projects/social-scout
source venv/bin/activate
python run.py                    # Start dev server (port 8000)

# Production (via service manager)
sm start social-scout            # Start service (port 5010)
sm restart social-scout          # Restart after changes
sm logs social-scout             # View logs

# Testing
pytest                           # Run all tests
pytest tests/test_file.py -v     # Single test file
pytest -m "not slow"             # Skip slow tests

# Playwright (required for Tier 2 browser verification)
playwright install chromium
```

## Production Deployment

- **Service**: `social-scout` via service manager (port 5010)
- **URL**: https://dr.eamer.dev/social-scout/
- **Health**: https://dr.eamer.dev/social-scout/api/health

## Architecture

Account discovery tool using three-tier verification to find user accounts across 30+ social media platforms. Achieves <5% false positive rate through intelligent verification.

### Three-Tier Verification System

| Tier | Method | Confidence | Platforms |
|------|--------|------------|-----------|
| **1** | API | 95-100% | GitHub, Reddit, Bluesky, Medium, TikTok, Twitter |
| **2** | Browser (Playwright) | 85% | Instagram, Facebook, LinkedIn, YouTube, Twitch, Pinterest |
| **3** | HTTP + Content Analysis | 70-90% | Steam, GitLab, Patreon, SoundCloud, DEV.to, Dribbble, etc. |

### Directory Structure

```
backend/
├── api/              # FastAPI REST API (main.py, schemas.py)
├── config/
│   ├── settings.py   # Pydantic settings (port, timeouts, confidence)
│   └── platforms.yaml # Platform definitions (add new platforms here)
├── core/
│   ├── search.py     # Search orchestration (async generators, concurrency)
│   ├── registry.py   # Platform registry singleton
│   ├── whatsmyname.py # WhatsMyName integration for deep search
│   └── username_variations.py # Username variation generation
├── db/
│   ├── models.py     # SQLAlchemy models (Search, Account, PlatformCheck)
│   ├── crud.py       # Database operations
│   └── session.py    # Async SQLite session management
└── platforms/
    ├── base.py       # BaseVerifier ABC, VerificationResult dataclass
    └── verifiers/
        ├── api.py    # Tier 1: API-based verification
        ├── browser.py # Tier 2: Playwright browser automation
        ├── http.py   # Tier 3: HTTP with content analysis
        └── wmn.py    # WhatsMyName verifier for deep search
```

## Key Components

### Search Flow
1. `POST /api/searches` creates search record, starts background task
2. `search_username()` in `core/search.py` yields results as `AsyncGenerator`
3. Verifiers are selected based on platform's `verification_method`
4. Results streamed to database via `run_search_task()` background task
5. Frontend polls `/api/searches/{id}` for progress updates

### Adding a New Platform
1. Add entry to `backend/config/platforms.yaml`:
   ```yaml
   newplatform:
     name: New Platform
     category: social
     tier: 1  # 1=API, 2=Browser, 3=HTTP
     enabled: true
     url_template: "https://example.com/{username}"
     api_endpoint: "https://api.example.com/users/{username}"  # For tier 1
     verification_method: api  # or browser, http
   ```
2. For custom API logic, add handler in `api.py._verify_{platform}()`
3. For browser platforms, add handler in `browser.py._check_{platform}()`

### Verifier Pattern
All verifiers inherit from `BaseVerifier`:
```python
class MyVerifier(BaseVerifier):
    async def verify(self, username: str) -> VerificationResult:
        # Return self._create_result(username, found, confidence, ...)
```

### Database Models
- **Search**: Tracks a search session (username, progress, status)
- **Account**: Found accounts with profile data and confidence scores
- **PlatformCheck**: Record of every platform check (found or not)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Overall statistics |
| `/api/searches` | POST | Create new search |
| `/api/searches` | GET | List all searches |
| `/api/searches/{id}` | GET | Get search details/progress |
| `/api/searches/{id}/results` | GET | Get found accounts |
| `/api/searches/{id}/checks` | GET | Get all platform checks |
| `/api/accounts` | GET | List accounts (filter by status) |
| `/api/accounts/{id}` | PATCH | Update account status |
| `/api/accounts/{id}/feedback` | POST | Submit accuracy feedback |
| `/api/platforms` | GET | List supported platforms |

## Configuration

Environment variables (`.env`):
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Key settings in `config/settings.py`:
- `max_concurrent_requests`: 200 (high for parallel search)
- `request_timeout`: 5 seconds (aggressive for speed)
- `api_confidence`: 95, `browser_confidence`: 85, `http_confidence`: 70

## Frontend

Static HTML frontend in `frontend/index.html` (pre-built). Development version in `frontend/frontend-temp/` (React + Vite + shadcn/ui).
