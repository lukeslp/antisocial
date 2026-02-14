# Antisocial

Ever think about an old account and get embarrassed? Find your forgotten digital footprints across 30+ platforms before someone else does.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Live](https://img.shields.io/badge/live-dr.eamer.dev%2Fantisocial-cyan.svg)

![Antisocial](frontend/og-image.jpg)

## The Problem

Remember that MySpace profile? That GitHub from your "rockstar developer" phase? That Reddit account with the username you definitely regret?

Most account discovery tools will happily tell you that you have accounts on 500 platforms. Spoiler: you don't. They just saw a 200 OK response and called it a day. Sherlock, the most popular tool, has a **30-40% false positive rate** because it basically just checks if pages load.

This tool actually verifies accounts exist. <5% false positives. You're welcome.

## How It Works

**Tier 1 - Official APIs (95%+ confidence)**
GitHub, Reddit, Bluesky, Medium, TikTok - hits the official APIs. If the platform says you exist, you exist.

**Tier 2 - Browser Automation (85% confidence)**
Instagram, Facebook, LinkedIn, YouTube - actually loads the page in a browser and checks if your profile is there. Yes, this is overkill. Yes, it's necessary.

**Tier 3 - Smart HTTP (70-90% confidence)**
Steam, GitLab, Patreon, SoundCloud, Dribbble - makes HTTP requests but actually reads the response instead of just checking the status code like some kind of amateur.

## Features

- **Three-tier verification** - API calls, browser automation, and smart HTTP analysis (see above)
- **30+ supported platforms** - all the usual suspects where you made bad decisions in 2012
- **Username variations** - automatically tries platform-specific patterns (luke.steuber → lukesteuber, luke-steuber, because of course different platforms have different rules)
- **Real-time results** - streams results as they arrive, checks popular platforms first so you don't sit there watching a progress bar
- **Account management** - mark false positives, track what you've deleted, feel productive
- **Deep search mode** - optional WhatsMyName integration for 500+ additional platforms (if you really want to know)
- **Fast parallel search** - 200 concurrent requests because patience is overrated

## Installation

```bash
# Clone the repository
git clone https://github.com/lukeslp/antisocial.git
cd antisocial

# Create virtual environment (you know the drill)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install browser for the fancy Tier 2 checks
playwright install chromium

# Run the server
python run.py
```

The API will be available at `http://localhost:8000`

## Usage

**Start a search:**
```bash
curl -X POST http://localhost:8000/api/searches \
  -H "Content-Type: application/json" \
  -d '{"username": "your-regrettable-username", "tiers": [1, 2, 3]}'
```

**Check progress:**
```bash
curl http://localhost:8000/api/searches/1
```

**Face the music:**
```bash
curl http://localhost:8000/api/searches/1/results
```

**See what platforms we check:**
```bash
curl http://localhost:8000/api/platforms
```

## API Endpoints

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/api/health` | GET | Confirms the server hasn't given up |
| `/api/stats` | GET | How many searches, accounts, and platforms you've subjected to this |
| `/api/searches` | POST | Start a new search (brace yourself) |
| `/api/searches` | GET | List all your searches |
| `/api/searches/{id}` | GET | Check how far along your existential crisis is |
| `/api/searches/{id}/results` | GET | The moment of truth |
| `/api/platforms` | GET | See all 30+ platforms we check |
| `/api/accounts` | GET | All the accounts you've discovered (sorry) |
| `/api/accounts/{id}` | PATCH | Mark as confirmed, false positive, or deleted |
| `/api/accounts/bulk-update` | POST | Update multiple accounts at once (efficiency!) |

## Configuration

Create a `.env` file:
```
DEBUG=false
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./data/accounts.db
```

Key settings (in `backend/config/settings.py`):
- `max_concurrent_requests`: 200 - go fast or go home
- `request_timeout`: 5 seconds - most platforms respond in 1-2s, the rest get skipped
- Confidence thresholds: API (95%), Browser (85%), HTTP (70%)

## Architecture

```
backend/
├── api/              # FastAPI with async background tasks
├── config/           # Settings and platform definitions (platforms.yaml)
├── core/             # The actual search logic
├── db/               # SQLAlchemy models for tracking everything
└── platforms/
    ├── base.py       # BaseVerifier pattern (inheritance! design patterns!)
    └── verifiers/    # The three tiers of verification
```

**The smart bits:**
- Async generators stream results in real-time (no waiting for everything to finish)
- Platform prioritization checks popular sites first (GitHub before Vimeo, sorry Vimeo)
- Semaphore-based concurrency prevents rate limiting (learned that lesson the hard way)
- Username variations try multiple formats (because platforms can't agree on anything)
- Background tasks so you don't block the API (professionalism!)

## Adding New Platforms

Edit `backend/config/platforms.yaml`:
```yaml
newplatform:
  name: New Platform
  category: social      # or professional, creative, gaming, developer
  tier: 1
  enabled: true
  url_template: "https://example.com/{username}"
  api_endpoint: "https://api.example.com/users/{username}"
  verification_method: api  # api, browser, or http
```

For complex platforms (because nothing is ever simple), add a custom handler in the appropriate verifier (`api.py`, `browser.py`, or `http.py`).

## Tech Stack

- **Backend**: FastAPI (for speed), SQLAlchemy (for sanity), Playwright (for overkill), httpx (for async)
- **Database**: SQLite with async support (because why not)
- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Deployment**: Live at [dr.eamer.dev/antisocial](https://dr.eamer.dev/antisocial/)

## Why Three Tiers?

Because some platforms have APIs (lucky us), some need browser automation (looking at you, Instagram), and some we just have to scrape like it's 2010 (sorry Steam). Different platforms, different approaches. All roads lead to "does this account exist or not?"

## Performance Notes

- Checks high-volume platforms first (GitHub, Reddit, Twitter) so you get results quickly
- 200 concurrent requests max (any more and platforms get angry)
- 5-second timeout per platform (if you're slow, you're out)
- Streams results as they arrive (no "loading... 47%" nonsense)
- Tries username variations automatically (because luke.steuber and lukesteuber might both exist)

## License

MIT License - see LICENSE file for details. Use responsibly. Don't be creepy.

## Author

**Luke Steuber**
Website: [dr.eamer.dev](https://dr.eamer.dev)
Bluesky: [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)
Email: luke@lukesteuber.com

Built this because I was tired of false positives. Enjoy.
