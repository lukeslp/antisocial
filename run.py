#!/usr/bin/env python3
"""Entry point for Antisocial backend."""
import uvicorn
from backend.config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
