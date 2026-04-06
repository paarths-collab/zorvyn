from typing import List, Union
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "DEV_ONLY_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    DATABASE_URL: str = "sqlite:///./finance_v2.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )

    @model_validator(mode="after")
    def normalize_sqlite_path(self):
        # Render Postgres URLs often use postgres:// which SQLAlchemy does not accept.
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        # Make sqlite relative paths stable regardless of process CWD.
        if self.DATABASE_URL.startswith("sqlite:///./"):
            project_root = Path(__file__).resolve().parents[2]
            rel_path = self.DATABASE_URL.replace("sqlite:///./", "", 1)
            abs_path = (project_root / rel_path).resolve()
            self.DATABASE_URL = f"sqlite:///{abs_path.as_posix()}"
        return self

settings = Settings()
