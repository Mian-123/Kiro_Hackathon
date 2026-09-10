from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_role_key: str = "placeholder"
    supabase_jwt_secret: str = "placeholder"

    # AI — set AI_PROVIDER and GROQ_API_KEY in .env
    ai_provider: str = "groq"
    groq_api_key: str = ""
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    groq_text_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""

    # App
    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    secret_key: str = "dev-secret-change-in-production"

    # Thresholds
    duplicate_search_radius_m: float = 500.0
    duplicate_time_window_hours: float = 72.0
    duplicate_merge_threshold: float = 0.75
    duplicate_review_threshold: float = 0.50
    ai_relevance_threshold: float = 0.50

    # Demo
    demo_password: str = "demo1234"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
