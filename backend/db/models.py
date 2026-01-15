"""SQLAlchemy database models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Search(Base):
    """A username search across platforms."""
    __tablename__ = "searches"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    platforms_total = Column(Integer, default=0)
    platforms_checked = Column(Integer, default=0)
    accounts_found = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    accounts = relationship("Account", back_populates="search", cascade="all, delete-orphan")
    platform_checks = relationship("PlatformCheck", back_populates="search", cascade="all, delete-orphan")


class Account(Base):
    """A discovered account on a platform."""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("searches.id"), nullable=False)
    platform_id = Column(String(50), nullable=False)
    platform_name = Column(String(100), nullable=False)
    username = Column(String(100), nullable=False)
    profile_url = Column(String(500), nullable=False)

    # Profile data
    display_name = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Verification
    verification_method = Column(String(20), nullable=False)  # api, browser, http
    confidence_score = Column(Integer, default=0)

    # Status tracking
    status = Column(String(20), default="pending")  # pending, confirmed, false_positive, deleted

    # Accuracy feedback: 1 = correct (thumbs up), -1 = incorrect (thumbs down), 0 = no feedback
    accuracy_feedback = Column(Integer, default=0)

    # Timestamps
    discovered_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    # Relationships
    search = relationship("Search", back_populates="accounts")


class PlatformCheck(Base):
    """Record of a platform check during a search (both found and not found)."""
    __tablename__ = "platform_checks"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("searches.id"), nullable=False)
    platform_id = Column(String(50), nullable=False)
    platform_name = Column(String(100), nullable=False)
    profile_url = Column(String(500), nullable=False)
    found = Column(Boolean, default=False)
    checked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    search = relationship("Search", back_populates="platform_checks")
