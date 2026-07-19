from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    UPLOAD_DIR: str = "uploads"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ENVIRONMENT: str = "development"
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Base folder for the "import from server folder" resume upload method.
    # Resumes are read from <RESUME_BASE_PATH>/<Job Opening>/<Internal|External>.
    RESUME_BASE_PATH: str = ""

    # --- Email ---
    # Provider: "smtp" (Gmail etc.), or an HTTP API that works even when the
    # network blocks SMTP ports: "brevo" or "sendgrid".
    EMAIL_PROVIDER: str = "smtp"
    EMAIL_FROM: str = ""  # verified sender address; falls back to SMTP_FROM/SMTP_USER
    SMTP_FROM_NAME: str = "Hazel Hiring Copilot"
    # SMTP (used when EMAIL_PROVIDER=smtp)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # e.g. kirti.khohal@gmail.com
    SMTP_PASSWORD: str = ""  # Gmail App Password (NOT the account password)
    SMTP_FROM: str = ""
    # HTTP API keys (used when EMAIL_PROVIDER=brevo / sendgrid)
    BREVO_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    # Where password-reset links point (the running frontend origin).
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def email_from(self) -> str:
        return self.EMAIL_FROM or self.SMTP_FROM or self.SMTP_USER

    @property
    def email_configured(self) -> bool:
        provider = (self.EMAIL_PROVIDER or "smtp").lower()
        if provider == "brevo":
            return bool(self.BREVO_API_KEY and self.email_from)
        if provider == "sendgrid":
            return bool(self.SENDGRID_API_KEY and self.email_from)
        return bool(self.SMTP_USER and self.SMTP_PASSWORD)


settings = Settings()