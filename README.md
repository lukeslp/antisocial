# Antisocial

Find forgotten accounts across 30+ social media platforms using three-tier verification.

![Python](https://img.shields.io/badge/python-3.10%2B-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/fastapi-0.100%2B-009688?style=flat-square)
![React](https://img.shields.io/badge/react-19-61dafb?style=flat-square)
![Playwright](https://img.shields.io/badge/playwright-browser_automation-2EAD33?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
[![Live](https://img.shields.io/badge/live-dr.eamer.dev%2Fantisocial-cyan?style=flat-square)](https://dr.eamer.dev/antisocial/)

## Overview

That account you made in 2014 and completely forgot about? Still out there.

Most username finders just check if a URL returns a 200. Works until it doesn't — false positive rates around 30-40% when platforms serve the same page whether the account exists or not.

This one uses three verification tiers: official APIs first, then browser automation, then HTTP content analysis. Gets false positives down to around 5%. Not perfect — web scraping never is — but meaningfully better than a status code.

## Features

- Three verification tiers: official APIs (most reliable), browser automation, and HTTP content analysis — each kicking in when the previous tier isn't available
- Searches 30+ platforms including GitHub, Reddit, Bluesky, Twitter, Instagram, TikTok, LinkedIn, YouTube
- Tries platform-specific username patterns automatically (e.g. `luke.steuber` → `luke-steuber` for GitHub)
- Streams results in real time as platforms respond, prioritizing high-traffic sites first
- Confirms, flags, or removes found accounts; export filtered results as CSV/JSON
- Deep search mode adds 500+ platforms via WhatsMyName database
- Runs 200 concurrent requests with semaphore-based rate protection

## Installation

```bash
git clone https://github.com/lukeslp/antisocial.git
cd antisocial

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium

python run.py
```

Server runs at http://localhost:8000. API docs at http://localhost:8000/docs.

## Usage

Start a search:
```bash
curl -X POST http://localhost:8000/api/searches \
  -H "Content-Type: application/json" \
  -d '{"username": "example", "tiers": [1, 2, 3]}'
```

Check progress:
```bash
curl http://localhost:8000/api/searches/1
```

Get results:
```bash
curl http://localhost:8000/api/searches/1/results
```

Deep search (500+ platforms via WhatsMyName):
```bash
curl -X POST http://localhost:8000/api/searches \
  -H "Content-Type: application/json" \
  -d '{"username": "example", "tiers": [1, 2, 3], "deep_search": true}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Total searches, accounts, platforms |
| `/api/searches` | POST | Start a new search |
| `/api/searches` | GET | List all searches |
| `/api/searches/{id}` | GET | Search details and progress |
| `/api/searches/{id}/results` | GET | Found accounts |
| `/api/searches/{id}/checks` | GET | All platforms checked (add `?found=true` to filter) |
| `/api/platforms` | GET | Supported platforms |
| `/api/accounts` | GET | All accounts (filter by `?status=confirmed\|false_positive`) |
| `/api/accounts/{id}` | PATCH | Update account status |
| `/api/accounts/bulk-update` | POST | Bulk status update |
| `/api/accounts/{id}/feedback` | POST | Accuracy feedback (1=correct, -1=incorrect, 0=clear) |
| `/api/accuracy` | GET | Per-platform accuracy statistics |

## Configuration

Create `.env`:
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Key settings in `backend/config/settings.py`:
- `max_concurrent_requests`: 200
- `request_timeout`: 5s
- Confidence thresholds: API (95%), Browser (85%), HTTP (70%)

## Architecture

```
backend/
├── api/              # FastAPI REST API
├── config/           # Settings and platform definitions
├── core/             # Search orchestration + username variations
├── db/               # SQLAlchemy models (Search, Account, PlatformCheck)
└── platforms/
    ├── base.py       # BaseVerifier + VerificationResult
    └── verifiers/    # api.py, browser.py, http.py, wmn.py
```

Add a new platform by editing `backend/config/platforms.yaml`:
```yaml
newplatform:
  name: New Platform
  category: social
  tier: 3
  enabled: true
  url_template: "https://example.com/{username}"
  verification_method: http
```

For platforms that need custom logic, add a `_verify_{platform_id}()` method to the appropriate verifier file.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Playwright, httpx
- Database: SQLite with async support (aiosqlite)
- Frontend: React, Vite, Tailwind CSS, shadcn/ui
- Live: https://dr.eamer.dev/antisocial/

## License

MIT — see LICENSE file.

## Author

**Luke Steuber** · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)

