# Account Discovery Tool

Find and manage old accounts across 30+ social media platforms with a reliable three-tier verification system.

## Features

- **Three-Tier Verification System**
  - Tier 1 (API): Official platform APIs for 95%+ confidence
  - Tier 2 (Browser): Browser automation for 85% confidence
  - Tier 3 (HTTP): Enhanced HTTP with content analysis for 70% confidence

- **30+ Supported Platforms**: GitHub, Reddit, Bluesky, Twitter, Instagram, TikTok, LinkedIn, and more

- **Low False Positive Rate**: Unlike tools like Sherlock (30-40% false positives), this tool achieves <5% false positive rate through intelligent verification

- **Account Management**: Track, confirm, and manage discovered accounts for cleanup

## Installation

```bash
# Clone the repository
git clone https://github.com/lukeslp/account-discovery.git
cd account-discovery

# Install dependencies
pip install -r requirements.txt

# Run the backend
python run.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/stats` | GET | Get statistics |
| `/api/searches` | POST | Create new search |
| `/api/searches` | GET | List all searches |
| `/api/searches/{id}` | GET | Get search details |
| `/api/searches/{id}/results` | GET | Get search results |
| `/api/accounts` | GET | List all accounts |
| `/api/accounts/{id}` | PATCH | Update account status |
| `/api/accounts/bulk-update` | POST | Bulk update accounts |
| `/api/platforms` | GET | List supported platforms |

## Architecture

```
backend/
├── api/           # FastAPI REST API
├── config/        # Settings and platform registry
├── core/          # Search orchestration
├── db/            # SQLAlchemy models and CRUD
└── platforms/     # Three-tier verifier system
```

## License

MIT
