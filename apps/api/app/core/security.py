import jwt
from datetime import datetime, timedelta
from typing import Optional, Union, Any
import bcrypt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default access token expiry
        # Strip trailing 'd' or 'm' if simple string, or parse. E.g. '7d' -> 7 days
        days = 7
        if settings.JWT_ACCESS_EXPIRES.endswith('d'):
            days = int(settings.JWT_ACCESS_EXPIRES[:-1])
        expire = datetime.utcnow() + timedelta(days=days)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        days = 30
        if settings.JWT_REFRESH_EXPIRES.endswith('d'):
            days = int(settings.JWT_REFRESH_EXPIRES[:-1])
        expire = datetime.utcnow() + timedelta(days=days)
        
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str, is_refresh: bool = False) -> dict:
    secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_ACCESS_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return {}
