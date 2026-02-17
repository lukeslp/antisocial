# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cd /home/coolhand/projects/social-scout
source venv/bin/activate
python run.py                    # Dev server (port 8000, auto-reloads when DEBUG=true)

# Production (via service manager)
sm start antisocial              # Port 5010
sm restart antisocial
sm logs antisocial

# Tests
pytest                           # All tests (verbose by default via pytest.ini)
pytest tests/test_file.py -v     # Specific file
pytest -m "not slow"             # Skip slow tests
pytest -m "not integration"      # Skip integration tests

# Frontend dev (React + Vite, port 5011)
cd frontend/frontend-temp
pnpm install
pnpm dev                         # Dev server with base path /social-scout/
pnpm build                       # Outputs to dist/public/

# Playwright (required for Tier 2 browser verification)
playwright install chromium
```

Production URL: https://dr.eamer.dev/antisocial/
GitHub repo: `lukeslp/antisocial` (local dir is `social-scout`)

## Architecture

Account discovery tool using three-tier verification to find user accounts across 30+ social media platforms. Achieves <5% false positive rate through intelligent verification strategies.

### Three-Tier Verification System

| Tier | Method | Confidence | Verifier | Examples |
|------|--------|------------|----------|----------|
| 1 | Official APIs | 95-100% | `APIVerifier` | GitHub, Reddit, Bluesky, Medium, TikTok |
| 2 | Browser automation | 85% | `BrowserVerifier` | Instagram, Facebook, LinkedIn, YouTube |
| 3 | HTTP + content analysis | 70-90% | `HTTPVerifier` | Steam, GitLab, Patreon, SoundCloud, Dribbble |

**WhatsMyName Integration**: Deep search mode adds 500+ platforms from `backend/config/wmn-data.json` via `WMNVerifier`.

### Core Architecture Patterns

**BaseVerifier** (`platforms/base.py`): All verifiers inherit from this and implement `async verify(username) -> VerificationResult`. Use `_create_result()` helper rather than constructing `VerificationResult` directly — it handles confidence zeroing for not-found cases.

**Username Variations** (`core/username_variations.py`): Generates platform-specific patterns (e.g. `luke.steuber` → `luke-steuber` for GitHub). Only platforms in `variation_platforms` set use this; others receive the raw username to avoid wasted API calls.

**Background Task + Polling**: `POST /api/searches` returns immediately with a `Search` record; the actual search runs in a FastAPI background task. Frontend polls `/api/searches/{id}` for progress (`platforms_checked`, `accounts_found`, `status`).

**Semaphore Concurrency**: `asyncio.Semaphore(200)` in `core/search.py` limits concurrent requests. Platform-specific rate limiting is not yet implemented.

**Platform Prioritization**: `core/search.py` sorts platforms so high-volume ones (GitHub, Reddit, Twitter, Instagram) run first for faster initial results.

### Database Models

Three SQLAlchemy async models in `db/models.py`:
- **Search**: Username search metadata (`status`: pending/running/completed, progress counters)
- **Account**: Found accounts with profile data (`display_name`, `bio`, `avatar_url`, `confidence_score`, `status`, `accuracy_feedback`)
- **PlatformCheck**: Every platform checked (found or not) — used to show "not found" history

### Directory Structure

```
backend/
├── api/
│   ├── main.py         # FastAPI app, CORS, background task runner
│   └── schemas.py      # Pydantic request/response models
├── config/
│   ├── settings.py     # Pydantic settings (loaded from .env)
│   ├── platforms.yaml  # Platform definitions — add new platforms here
│   └── wmn-data.json   # WhatsMyName database (500+ platforms)
├── core/
│   ├── search.py       # Search orchestration, async generator, platform prioritization
│   ├── registry.py     # Platform registry singleton (loads platforms.yaml)
│   ├── username_variations.py  # Platform-specific username pattern generation
│   └── whatsmyname.py  # WhatsMyName deep search integration
├── db/
│   ├── models.py       # SQLAlchemy models
│   ├── crud.py         # All database operations
│   └── session.py      # Async SQLite session + init_db()
└── platforms/
    ├── base.py         # BaseVerifier + VerificationResult dataclass
    └── verifiers/
        ├── api.py      # Tier 1 — Official APIs
        ├── browser.py  # Tier 2 — Playwright browser automation
        ├── http.py     # Tier 3 — HTTP + content analysis
        └── wmn.py      # WhatsMyName integration
frontend/
├── index.html          # Production static build (deployed)
└── frontend-temp/      # React + Vite + shadcn/ui source
    └── vite.config.ts  # base: '/social-scout/', dev port 5011
```

### Adding a New Platform

**Option 1: platforms.yaml** (standard platforms)
```yaml
newplatform:
  name: New Platform
  category: social      # social, professional, creative, gaming, developer
  tier: 3
  enabled: true
  url_template: "https://example.com/{username}"
  verification_method: http  # api, browser, or http
```

**Option 2: Custom verifier method** (complex platforms)
Add `_verify_{platform_id}()` to `api.py`, `_check_{platform_id}()` to `browser.py`, or `_verify_{platform_id}()` to `http.py`. Platform-specific quirks stay isolated within the verifier class.

**Option 3: Username variations** (special patterns needed)
Add the platform to `variation_platforms` set and add a case in `generate_variations()` in `core/username_variations.py`.

### Search Flow

1. `POST /api/searches` creates Search (`status="pending"`) and starts background task
2. `search_username()` async generator yields `VerificationResult` per platform
3. For each result: create `PlatformCheck` record; if found + confidence ≥ threshold, create `Account`
4. `Search.platforms_checked` / `accounts_found` updated incrementally
5. On completion: `status="completed"`, `completed_at=now()`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Total searches, accounts, platforms |
| `/api/searches` | POST | Create search (`username`, `tiers`, `min_confidence`, `deep_search`) |
| `/api/searches` | GET | List all searches |
| `/api/searches/{id}` | GET | Search details + progress |
| `/api/searches/{id}/results` | GET | Found accounts for a search |
| `/api/searches/{id}/checks` | GET | All platform checks (pass `?found=true/false` to filter) |
| `/api/platforms` | GET | Supported platforms |
| `/api/accounts` | GET | All accounts (`?status=confirmed\|false_positive\|all`) |
| `/api/accounts/{id}` | PATCH | Update account status |
| `/api/accounts/bulk-update` | POST | Bulk status update |
| `/api/accounts/{id}/feedback` | POST | Accuracy feedback (`feedback`: 1=correct, -1=incorrect, 0=clear) |
| `/api/accuracy` | GET | Per-platform accuracy statistics |

## Configuration

`.env` (loaded via `pydantic_settings`):
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Key settings in `backend/config/settings.py`:
- `max_concurrent_requests`: 200
- `request_timeout`: 5s
- `api_confidence`: 95, `browser_confidence`: 85, `http_confidence`: 70
- `screenshots_dir`: `data/screenshots/` (auto-created on startup)

**CORS**: Origins hardcoded in `main.py` (`dr.eamer.dev` domains + localhost 3000/5173).

## Frontend

- **Production**: `frontend/index.html` — static pre-built, served directly
- **Development**: `frontend/frontend-temp/` — React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
  - Vite base path: `/social-scout/`
  - Dev port: 5011
  - Real-time polling for search progress; confirm/deny UI for filtering the exported report
