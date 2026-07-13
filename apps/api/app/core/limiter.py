"""
limiter.py — Rate Limiter backed by Valkey
==========================================
Uses slowapi with a Valkey (Redis-protocol compatible) storage backend.
Sliding window counters are persisted in Valkey for distributed
rate limiting across multiple API workers.
"""
import sys
import valkey
import valkey.asyncio as aivalkey
sys.modules['redis'] = valkey
sys.modules['redis.asyncio'] = aivalkey

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
import socket

def is_valkey_running(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except Exception:
        return False

valkey_active = is_valkey_running(settings.VALKEY_HOST, settings.VALKEY_PORT)
storage_uri = settings.VALKEY_URL if valkey_active else "memory://"

# Valkey is Redis-protocol compatible. If Valkey is down, fall back to local memory.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=storage_uri,
)
