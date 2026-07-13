import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Core Server Settings
    ENV: str = Field(default="development", validation_alias="NODE_ENV")
    PORT: int = Field(default=5000)
    CLIENT_URL: str = Field(default="http://localhost:5173")

    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/worksphere_erp"
    )
    # Valkey Settings (Redis-protocol compatible open-source in-memory datastore)
    VALKEY_URL: str = Field(default="redis://localhost:6379")
    VALKEY_HOST: str = Field(default="localhost")
    VALKEY_PORT: int = Field(default=6379)
    VALKEY_PASSWORD: str = Field(default="")
    # CACHE_URL is an alias for VALKEY_URL used by cache/session/queue services
    CACHE_URL: str = Field(default="redis://localhost:6379")

    # Security & Auth
    JWT_ACCESS_SECRET: str = Field(default="44ef6e8b4e7235a963cfdb56ef6d7f02dcd04e0eef7f0d046fbc9e7a9e6bc7jl")
    JWT_REFRESH_SECRET: str = Field(default="de4ee4f0e0dbef6d0e7a8fbce0e0ee0c4ef6b0ee04fbc8ea9eb0ee047fd0pnqd")
    JWT_ACCESS_EXPIRES: str = Field(default="7d")
    JWT_REFRESH_EXPIRES: str = Field(default="30d")
    ENCRYPTION_KEY: str = Field(default="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d")

    # Cloudinary (Storage)
    CLOUDINARY_CLOUD_NAME: Optional[str] = Field(default=None)
    CLOUDINARY_API_KEY: Optional[str] = Field(default=None)
    CLOUDINARY_API_SECRET: Optional[str] = Field(default=None)

    # Email SMTP Settings
    SMTP_HOST: str = Field(default="smtp.mailtrap.io")
    SMTP_PORT: int = Field(default=2525)
    SMTP_USER: str = Field(default="fake_smtp_user")
    SMTP_PASS: str = Field(default="fake_smtp_password")
    EMAIL_FROM: str = Field(default="noreply@worksphere.com")

    # Twilio SMS Settings
    SMS_PROVIDER: str = Field(default="twilio")
    TWILIO_ACCOUNT_SID: Optional[str] = Field(default=None)
    TWILIO_AUTH_TOKEN: Optional[str] = Field(default=None)
    TWILIO_FROM_NUMBER: Optional[str] = Field(default=None)

    # Feature Flags
    FF_BIOMETRIC_ATTENDANCE: bool = Field(default=True)
    FF_WHATSAPP_NOTIFICATIONS: bool = Field(default=False)
    FF_AI_INSIGHTS: bool = Field(default=True)
    FF_GOOGLE_SSO: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
