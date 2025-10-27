from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ## Backend APP
    APP_NAME: str = "The Journal"
    DATABASE_URL: str = "sqlite+aiosqlite:///./journal.db"

    ## Local LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"


settings = Settings()
