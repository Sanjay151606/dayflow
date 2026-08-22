import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "DAYFLOW – Human Resource Management System"
    TAGLINE: str = "Every workday, perfectly aligned."
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    
    # Storage Buckets
    SUPABASE_BUCKET_PROFILES: str = "profile-pictures"
    SUPABASE_BUCKET_DOCS: str = "employee-documents"
    SUPABASE_BUCKET_PAYROLL: str = "salary-slips"

    # Database
    DATABASE_URL: str = "sqlite:///./dayflow.db"

    # Security & JWT (Supporting both SECRET_KEY and JWT_SECRET)
    SECRET_KEY: str = "dayflow_super_secure_jwt_secret_key_change_in_production_2026!"
    JWT_SECRET: str = "dayflow_super_secure_jwt_secret_key_change_in_production_2026!"
    REFRESH_TOKEN_SECRET: str = "dayflow_super_secure_refresh_secret_key_change_in_production_2026!"
    JWT_REFRESH_SECRET: str = "dayflow_super_secure_refresh_secret_key_change_in_production_2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    # Storage fallback
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
    MAX_UPLOAD_SIZE_MB: int = 10

    # SMTP
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 2525
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
