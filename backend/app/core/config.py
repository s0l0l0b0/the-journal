from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "The Journal"
    DATABASE_URL: str = "sqlite+aiosqlite:///./journal.db"


settings = Settings()
