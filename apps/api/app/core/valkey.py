"""
valkey.py — Central Valkey Client for WorkSphere ERP
=============================================================
Valkey is a fully open-source, Redis-protocol compatible in-memory datastore.
This module provides:
  - Synchronous Valkey client (for FastAPI startup/shutdown)
  - Asynchronous Valkey client (for async route handlers)
  - Connection pool with configurable limits
  - Health check endpoint integration
  - Automatic reconnection with exponential backoff
  - Graceful shutdown handler
  - Singleton pattern — one connection pool per process
  - FastAPI dependency injection helper

Usage:
    from app.core.valkey import get_valkey, get_async_valkey

    # Sync (in non-async contexts):
    client = get_valkey()
    client.set("key", "value", ex=300)

    # Async (in route handlers):
    async def my_route(valkey_client = Depends(get_async_valkey)):
        await valkey_client.set("key", "value", ex=300)
"""

import asyncio
import logging
from typing import Optional, AsyncIterator

import valkey
import valkey.asyncio as aivalkey
from valkey.backoff import ExponentialBackoff
from valkey.retry import Retry
from valkey.exceptions import ConnectionError, TimeoutError, ValkeyError

import sys
sys.modules['redis'] = valkey
sys.modules['redis.asyncio'] = aivalkey

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Retry Configuration
# ─────────────────────────────────────────────────────────────────────────────
_RETRY = Retry(
    backoff=ExponentialBackoff(cap=10, base=1),
    retries=5,
    supported_errors=(ConnectionError, TimeoutError),
)

# ─────────────────────────────────────────────────────────────────────────────
# Synchronous Connection Pool (singleton)
# ─────────────────────────────────────────────────────────────────────────────
_sync_pool: Optional[valkey.ConnectionPool] = None


def _build_sync_pool() -> valkey.ConnectionPool:
    """Build a thread-safe synchronous connection pool to Valkey."""
    url = settings.VALKEY_URL
    logger.info(f"[Valkey] Initialising synchronous connection pool → {url}")
    return valkey.ConnectionPool.from_url(
        url,
        max_connections=20,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry=_RETRY,
        health_check_interval=30,
    )


def get_valkey() -> valkey.Valkey:
    """
    Return a synchronous Valkey client backed by the singleton pool.
    Safe to call from any context.
    """
    global _sync_pool
    if _sync_pool is None:
        _sync_pool = _build_sync_pool()
    return valkey.Valkey(connection_pool=_sync_pool)


# ─────────────────────────────────────────────────────────────────────────────
# Asynchronous Connection Pool (singleton)
# ─────────────────────────────────────────────────────────────────────────────
_async_pool: Optional[aivalkey.ConnectionPool] = None


def _build_async_pool() -> aivalkey.ConnectionPool:
    """Build an asyncio-compatible connection pool to Valkey."""
    url = settings.VALKEY_URL
    logger.info(f"[Valkey] Initialising async connection pool → {url}")
    return aivalkey.ConnectionPool.from_url(
        url,
        max_connections=50,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        health_check_interval=30,
    )


def get_async_valkey_pool() -> aivalkey.ConnectionPool:
    """Return the singleton async pool (lazy-initialised)."""
    global _async_pool
    if _async_pool is None:
        _async_pool = _build_async_pool()
    return _async_pool


async def get_async_valkey() -> AsyncIterator[aivalkey.Valkey]:
    """
    FastAPI dependency — yields an async Valkey client.

    Example:
        @router.get("/ping")
        async def ping(valkey_client: aivalkey.Valkey = Depends(get_async_valkey)):
            return await valkey_client.ping()
    """
    pool = get_async_valkey_pool()
    client = aivalkey.Valkey(connection_pool=pool)
    try:
        yield client
    finally:
        # Do NOT close the pool here — it is a singleton; only release the connection
        await client.aclose()


# ─────────────────────────────────────────────────────────────────────────────
# Lifecycle Hooks — call from FastAPI lifespan / startup / shutdown
# ─────────────────────────────────────────────────────────────────────────────
async def valkey_startup() -> None:
    """
    Initialise and verify the Valkey connection during application startup.
    Warns and falls back to degraded in-memory mode if Valkey is down.
    """
    try:
        pool = get_async_valkey_pool()
        client = aivalkey.Valkey(connection_pool=pool)
        pong = await client.ping()
        await client.aclose()
        if pong:
            logger.info("[Valkey] ✅ Connected successfully")
        else:
            logger.warning("[Valkey] PING returned unexpected value. Running in Degraded Mode.")
    except (ConnectionError, TimeoutError, ValkeyError, Exception) as exc:
        logger.warning(
            f"[Valkey] ⚠️ Valkey server is offline or unreachable at {settings.VALKEY_URL}. "
            "FastAPI backend will run in DEGRADED MODE (falling back to in-memory storage for rate-limiting)."
        )


async def valkey_shutdown() -> None:
    """
    Gracefully close all Valkey connections during application shutdown.
    """
    global _async_pool, _sync_pool
    try:
        if _async_pool is not None:
            logger.info("[Valkey] Closing async connection pool…")
            await _async_pool.aclose()
            _async_pool = None
        if _sync_pool is not None:
            logger.info("[Valkey] Closing sync connection pool…")
            _sync_pool.disconnect()
            _sync_pool = None
        logger.info("[Valkey] ✅ All connections closed")
    except Exception as exc:
        logger.warning(f"[Valkey] Warning during pool shutdown: {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# Health Check Helper
# ─────────────────────────────────────────────────────────────────────────────
async def valkey_health() -> dict:
    """
    Return a health status dict suitable for the /health endpoint.
    """
    import time
    try:
        pool = get_async_valkey_pool()
        client = aivalkey.Valkey(connection_pool=pool)
        t0 = time.monotonic()
        await client.ping()
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        await client.aclose()
        return {"status": "healthy", "datastore": "Valkey", "latency_ms": latency_ms}
    except Exception as exc:
        return {
            "status": "degraded (Valkey is offline, falling back to local memory)",
            "datastore": "Valkey",
            "error": str(exc)
        }
