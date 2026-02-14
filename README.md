# Antisocial

Find forgotten accounts across 30+ social media platforms using three-tier verification.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Live](https://img.shields.io/badge/live-dr.eamer.dev%2Fantisocial-cyan.svg)

## Overview

Most username discovery tools have 30-40% false positive rates because they only check HTTP status codes. This tool achieves under 5% false positives through intelligent three-tier verification.

Tier 1 uses official platform APIs (95%+ confidence). Tier 2 uses browser automation to verify page content (85% confidence). Tier 3 uses HTTP requests with content analysis (70-90% confidence).

## Features

- Three-tier verification system (API, browser automation, HTTP analysis)
- 30+ supported platforms (GitHub, Reddit, Bluesky, Twitter, Instagram, TikTok, LinkedIn, YouTube, etc.)
- Username variation detection (tries platform-specific patterns automatically)
- Real-time streaming results with platform prioritization
- Account management (track, confirm, mark false positives)
- Optional deep search mode (500+ additional platforms via WhatsMyName)
- Parallel search with 200 concurrent requests

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

Server runs at http://localhost:8000

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

List platforms:
```bash
curl http://localhost:8000/api/platforms
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Statistics |
| `/api/searches` | POST | Create search |
| `/api/searches` | GET | List searches |
| `/api/searches/{id}` | GET | Search details |
| `/api/searches/{id}/results` | GET | Found accounts |
| `/api/platforms` | GET | Supported platforms |
| `/api/accounts` | GET | List accounts |
| `/api/accounts/{id}` | PATCH | Update account |
| `/api/accounts/bulk-update` | POST | Bulk update |

## Configuration

Create `.env`:
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Settings in `backend/config/settings.py`:
- max_concurrent_requests: 200
- request_timeout: 5 seconds
- Confidence thresholds: API (95%), Browser (85%), HTTP (70%)

## Architecture

```
backend/
├── api/              # FastAPI REST API
├── config/           # Settings and platform definitions
├── core/             # Search orchestration
├── db/               # SQLAlchemy models
└── platforms/
    ├── base.py       # BaseVerifier pattern
    └── verifiers/    # Three-tier verification
```

Core patterns:
- Async generators for real-time streaming
- Platform prioritization (popular platforms first)
- Semaphore-based concurrency (prevents rate limiting)
- Username variations (platform-specific patterns)
- Background tasks (non-blocking execution)

## Adding Platforms

Edit `backend/config/platforms.yaml`:
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

For complex platforms, add custom handler in appropriate verifier file.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Playwright, httpx
- Database: SQLite with async support (aiosqlite)
- Frontend: React, Vite, Tailwind CSS, shadcn/ui
- Deployment: https://dr.eamer.dev/antisocial/

## License

MIT License - see LICENSE file.

## Author

Luke Steuber
- Website: https://dr.eamer.dev
- Bluesky: https://bsky.app/profile/lukesteuber.com
- Email: luke@lukesteuber.com
