import sys
import os
import time
import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

from app.core.config import settings

# Setup database logger
logger = logging.getLogger(__name__)

# ── DATABASE URL CLEANUP ──────────────────────────────────────────────────
# Standardize the database URL for SQLAlchemy 2.x
raw_url = settings.DATABASE_URL
if not raw_url:
    raise RuntimeError("DATABASE_URL is not configured in settings or environment variables.")

# 1. SQLAlchemy 2.x requires 'postgresql://' instead of Heroku/Neon legacy 'postgres://'
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

# 2. Ensure SSL mode is enabled for Neon cloud database connection security
if "sslmode=" not in raw_url:
    separator = "&" if "?" in raw_url else "?"
    raw_url = f"{raw_url}{separator}sslmode=require"

DATABASE_URL = raw_url

# ── DATABASE ENGINE CONFIGURATION ─────────────────────────────────────────
# Optimized for Neon serverless Postgres:
# - pool_pre_ping=True: reconnect automatically if connection is dropped
# - pool_recycle=1800: recycle connections every 30 minutes
# - pool_size=10, max_overflow=20: stable connection limit
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()

# FastAPI dependency for getting DB session
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── STARTUP VALIDATION & TELEMETRY FUNCTIONS ─────────────────────────────

def verify_db_connectivity() -> dict:
    """
    Test direct query connectivity to the database and query engine status.
    Raises Exception if connection is refused.
    """
    t0 = time.monotonic()
    with engine.connect() as conn:
        # Check connection
        result = conn.execute(text("SELECT 1")).scalar()
        if result != 1:
            raise OperationalError("Query execution returned unexpected result", params=None, orig=None)
        
        # Get database version
        version = conn.execute(text("SHOW server_version")).scalar()
        
        # Get current schema
        current_schema = conn.execute(text("SELECT current_schema()")).scalar()
        
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        
    return {
        "connected": True,
        "latency_ms": latency_ms,
        "version": version,
        "current_schema": current_schema,
        "pool_size": engine.pool.size(),
        "pool_checked_in": engine.pool.checkedin(),
        "pool_checked_out": engine.pool.checkedout(),
    }


def get_migration_status() -> dict:
    """
    Checks Alembic database schema migrations using programmatic alembic script context.
    """
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from alembic.runtime.migration import MigrationContext

    # Root of backend is where alembic.ini lives (2 levels up from core)
    ini_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "alembic.ini"
    )
    
    if not os.path.exists(ini_path):
        logger.warning(f"alembic.ini not found at expected path: {ini_path}")
        return {"status": "unknown", "error": "alembic.ini missing"}
        
    try:
        config = Config(ini_path)
        script = ScriptDirectory.from_config(config)
        
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
            
        head_rev = script.get_current_head()
        
        return {
            "current_revision": current_rev,
            "head_revision": head_rev,
            "up_to_date": current_rev == head_rev,
            "pending_migrations": current_rev != head_rev
        }
    except Exception as exc:
        logger.error(f"Failed to check migration status: {exc}")
        return {"status": "error", "error": str(exc)}
