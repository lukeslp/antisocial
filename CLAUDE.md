# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cd /home/coolhand/projects/social-scout
source venv/bin/activate
python run.py                    # Dev server (port 8000)

# Production (via service manager)
sm start social-scout            # Port 5010
sm restart social-scout
sm logs social-scout

# Tests
pytest
pytest tests/test_file.py -v

# Playwright (required for Tier 2 browser verification)
playwright install chromium
```

Production URL: https://dr.eamer.dev/social-scout/
GitHub repo: `lukeslp/account-discovery` (name mismatch -- `social-scout` is the local dir name)

## Architecture

Account discovery tool using three-tier verification to find user accounts across 30+ social media platforms. Achieves <5% false positive rate through intelligent verification strategies.

### Three-Tier Verification System

| Tier | Method | Confidence | Verifier | Examples |
|------|--------|------------|----------|----------|
| 1 | Official APIs | 95-100% | `APIVerifier` | GitHub, Reddit, Bluesky, Medium, TikTok |
| 2 | Browser automation | 85% | `BrowserVerifier` | Instagram, Facebook, LinkedIn, YouTube |
| 3 | HTTP + content analysis | 70-90% | `HTTPVerifier` | Steam, GitLab, Patreon, SoundCloud, Dribbble |

**WhatsMyName Integration**: Deep search mode adds 500+ platforms from WhatsMyName database via `WMNVerifier`.

### Core Architecture Patterns

**1. BaseVerifier Pattern**
All verifiers inherit from `BaseVerifier` and implement `async verify(username) -> VerificationResult`:
```python
class APIVerifier(BaseVerifier):
    async def verify(self, username: str) -> VerificationResult:
        # Platform-specific verification logic
        return self._create_result(username, found, confidence, ...)
```

**2. Username Variations**
`core/username_variations.py` generates platform-specific username patterns to improve discovery:
- Bluesky: `username` → `username.bsky.social`, `username.com`
- GitHub: `luke.steuber` → `luke-steuber`, `luke_steuber`, `lukesteuber`
- Twitter: `username` → `username_`, `_username`

Only platforms in `variation_platforms` use this feature to avoid wasting API calls.

**3. Async Generator Streaming**
Results stream via async generator for real-time frontend updates:
```python
async def search_username(...) -> AsyncGenerator[VerificationResult, None]:
    async for result in search_username(username, tiers):
        yield result  # Frontend polls database for updates
```

**4. Background Task Pattern**
FastAPI background tasks run searches asynchronously:
```python
@app.post("/api/searches")
async def create_search(..., background_tasks: BackgroundTasks):
    search = await crud.create_search(db, username, total_platforms)
    background_tasks.add_task(run_search_task, search.id, username, ...)
    return search  # Returns immediately, search runs in background
```

**5. Semaphore-Based Concurrency**
`asyncio.Semaphore(200)` limits concurrent requests to prevent rate limiting while maintaining speed.

**6. Platform Prioritization**
High-volume platforms checked first for faster initial results:
```python
high_priority = ['github', 'reddit', 'twitter', 'instagram', ...]
platforms = sorted(platforms, key=get_priority)
```

### Database Models

Three SQLAlchemy models track search state:

1. **Search**: Username search metadata (`status`, `platforms_total`, `platforms_checked`, `accounts_found`)
2. **Account**: Discovered accounts with profile data (`display_name`, `bio`, `avatar_url`, `confidence_score`, `status`)
3. **PlatformCheck**: Record of every platform checked (both found and not found) for search history

Relationships: `Search.accounts` and `Search.platform_checks` with cascade delete.

### Directory Structure

```
backend/
├── api/
│   ├── main.py         # FastAPI app, background tasks, CORS config
│   └── schemas.py      # Pydantic request/response models
├── config/
│   ├── settings.py     # Pydantic settings (max_concurrent_requests: 200, request_timeout: 5s)
│   └── platforms.yaml  # Platform definitions (add new platforms here)
├── core/
│   ├── search.py       # Search orchestration (async generators, platform prioritization)
│   ├── registry.py     # Platform registry singleton (loads platforms.yaml)
│   ├── username_variations.py  # Username pattern generation
│   └── whatsmyname.py  # WhatsMyName deep search integration
├── db/
│   ├── models.py       # SQLAlchemy models (Search, Account, PlatformCheck)
│   ├── crud.py         # Database operations
│   └── session.py      # Async SQLite session
└── platforms/
    ├── base.py         # BaseVerifier abstract class
    └── verifiers/
        ├── api.py      # Tier 1 - Official APIs
        ├── browser.py  # Tier 2 - Playwright browser automation
        ├── http.py     # Tier 3 - HTTP + content analysis
        └── wmn.py      # WhatsMyName integration
```

### Adding a New Platform

**Option 1: Add to platforms.yaml** (for standard platforms)
```yaml
newplatform:
  name: New Platform
  category: social      # social, professional, creative, gaming, developer
  tier: 1
  enabled: true
  url_template: "https://example.com/{username}"
  api_endpoint: "https://api.example.com/users/{username}"
  verification_method: api  # api, browser, or http
```

**Option 2: Custom verifier logic** (for complex platforms)
Add handler method in appropriate verifier:
- `api.py._verify_newplatform()` for Tier 1
- `browser.py._check_newplatform()` for Tier 2
- `http.py._verify_newplatform()` for Tier 3

**Option 3: Username variations** (if platform needs special patterns)
Add to `core/username_variations.py` in `generate_variations()` and add platform to `variation_platforms` set.

### Search Flow

1. `POST /api/searches` creates Search record with `status="pending"`
2. FastAPI background task starts `run_search_task()`
3. `search_username()` yields results as async generator
4. For each result:
   - Create `PlatformCheck` record (found or not)
   - If found + confidence ≥ threshold: Create `Account` record
   - Update `Search` progress (`platforms_checked`, `accounts_found`)
5. Complete search: Set `status="completed"`, `completed_at=now()`
6. Frontend polls `/api/searches/{id}` for progress updates

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Overall statistics (total searches, accounts, platforms) |
| `/api/searches` | POST | Create new search (starts background task) |
| `/api/searches` | GET | List all searches |
| `/api/searches/{id}` | GET | Search details/progress |
| `/api/searches/{id}/results` | GET | Found accounts for search |
| `/api/platforms` | GET | Supported platforms |
| `/api/accounts` | GET | List all accounts (with filters) |
| `/api/accounts/{id}` | PATCH | Update account status (`confirmed`, `false_positive`, `deleted`) |
| `/api/accounts/bulk-update` | POST | Bulk update account statuses |
| `/api/accounts/{id}/feedback` | POST | Accuracy feedback (thumbs up/down) |

## Configuration

`.env`:
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

**Key settings** (`backend/config/settings.py`):
- `max_concurrent_requests`: 200 (high concurrency for speed)
- `request_timeout`: 5 seconds (most platforms respond in 1-2s)
- `api_confidence`: 95
- `browser_confidence`: 85
- `http_confidence`: 70

**CORS origins**: Allowed origins hardcoded in `main.py` for security (dr.eamer.dev domains + localhost).

## Frontend

- **Production**: Static HTML in `frontend/index.html` (pre-built, deployed to production)
- **Development**: React + Vite + shadcn/ui in `frontend/frontend-temp/`
  - Tailwind CSS for styling
  - Real-time polling for search progress
  - Account management UI with status updates

## Performance Optimizations

1. **Platform prioritization**: High-volume platforms (GitHub, Reddit, Twitter) checked first
2. **Semaphore concurrency**: 200 concurrent requests max (prevents rate limiting)
3. **Aggressive timeout**: 5 seconds (most platforms respond in 1-2s)
4. **Async generators**: Stream results as they arrive (no waiting for all platforms)
5. **Username variations**: Try multiple formats to improve discovery rate
6. **Background tasks**: Non-blocking search execution

## Extending the System

**Adding a new verification tier**:
1. Create new verifier class in `platforms/verifiers/`
2. Inherit from `BaseVerifier`
3. Implement `async verify(username) -> VerificationResult`
4. Add to `core/search.py` in `get_verifier()` function

**Custom platform logic**:
Platform-specific handlers live in verifier classes as `_verify_{platform_id}()` or `_check_{platform_id}()` methods. This keeps platform quirks isolated while using the standard framework.

**Accuracy tracking**:
Users can provide feedback via thumbs up/down on discovered accounts. This data is stored in `Account.accuracy_feedback` for future improvements to verification logic.
