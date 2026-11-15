from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/contractalert"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    # One working day; there is no refresh token, the UI sends users back to login on expiry
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # AI provider used for contract extraction: "gemini" or "ollama"
    AI_PROVIDER: str = "gemini"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Ollama running on the host machine is reachable from Docker via host.docker.internal.
    # Use http://ollama:11434 with the "ollama" compose profile, or http://localhost:11434 outside Docker.
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    # Context window in tokens. Ollama's default is small and silently truncates long contracts.
    OLLAMA_NUM_CTX: int = 16384
    OLLAMA_TIMEOUT_SECONDS: int = 600
    # Email alerts
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_SSL: bool = False  # True for port 465, otherwise STARTTLS
    MAIL_FROM: str = ""
    ALERT_CRON: str = "0 8 * * *"
    ALERT_TIMEZONE: str = "UTC"
    APP_URL: str = ""

    class Config:
        # Root .env (shared with docker compose), then backend/.env for local overrides
        env_file = ("../.env", ".env")
        extra = "ignore"


settings = Settings()
