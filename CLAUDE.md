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

Account discovery tool using three-tier verification to find user accounts across 30+ social media platforms. Achieves <5% false positive rate.

### Three-Tier Verification

| Tier | Method | Confidence | Examples |
|------|--------|------------|---------|
| 1 | API calls | 95-100% | GitHub, Reddit, Bluesky, Medium, TikTok |
| 2 | Playwright browser | 85% | Instagram, Facebook, LinkedIn, YouTube |
| 3 | HTTP + content analysis | 70-90% | Steam, GitLab, Patreon, SoundCloud, Dribbble |

### Directory Structure

```
backend/
├── api/              # FastAPI REST API
├── config/
│   ├── settings.py   # Pydantic settings
│   └── platforms.yaml # Platform definitions (add new platforms here)
├── core/
│   ├── search.py     # Search orchestration (async generators)
│   ├── registry.py   # Platform registry singleton
│   └── whatsmyname.py # WhatsMyName deep search integration
├── db/
│   ├── models.py     # SQLAlchemy (Search, Account, PlatformCheck)
│   └── session.py    # Async SQLite session
└── platforms/
    └── verifiers/
        ├── api.py    # Tier 1
        ├── browser.py # Tier 2 (Playwright)
        ├── http.py   # Tier 3
        └── wmn.py    # WhatsMyName
```

### Search Flow

1. `POST /api/searches` creates search, starts background task
2. Verifiers selected per platform's `verification_method` in `platforms.yaml`
3. Results streamed to SQLite via async generator
4. Frontend polls `/api/searches/{id}` for progress

### Adding a New Platform

Add to `backend/config/platforms.yaml`:
```yaml
newplatform:
  name: New Platform
  category: social
  tier: 1
  enabled: true
  url_template: "https://example.com/{username}"
  api_endpoint: "https://api.example.com/users/{username}"
  verification_method: api
```

For custom logic, add handler in the appropriate verifier (`api.py._verify_{platform}()`, `browser.py._check_{platform}()`, etc.).

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/searches` | POST | Create new search |
| `/api/searches/{id}` | GET | Search details/progress |
| `/api/searches/{id}/results` | GET | Found accounts |
| `/api/platforms` | GET | Supported platforms |
| `/api/accounts/{id}` | PATCH | Update account status |

## Configuration

`.env`:
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Key settings: `max_concurrent_requests`: 200, `request_timeout`: 5s

## Frontend

Static HTML in `frontend/index.html` (pre-built). Dev version in `frontend/frontend-temp/` (React + Vite + shadcn/ui).
