from typing import Optional

import litellm
from pydantic_settings import BaseSettings, SettingsError


class LLMProviderSettings(BaseSettings):
    model: str
    api_key: Optional[str] = None
    api_base: Optional[str] = None


class Settings(BaseSettings):
    ## Backend APP
    APP_NAME: str = "The Journal"
    DATABASE_URL: str = "sqlite+aiosqlite:///./journal.db"

    ##### LLM #####

    # Model name structure is provider/model:version
    # LLM model name. Name should be in the format 'provider/model:version'.
    # Example: 'ollama/qwen3:0.6b' or 'gemini/gemini-2.5-flash'.
    LLM_MODEL_NAME: str = "ollama/qwen3:0.6b"

    # API key for non-ollama models. Required if using such models.
    LLM_API_KEY: Optional[str] = None

    # Base URL for the Ollama API. Required if using Ollama models.
    OLLAMA_BASE_URL: Optional[str] = "http://localhost:11434"

    @property
    def IS_OLLAMA_MODEL(self) -> bool:
        return self.LLM_MODEL_NAME.startswith("ollama/")

    @property
    def LLM_PROVIDER_SETTINGS(self) -> LLMProviderSettings:
        if not self.LLM_MODEL_NAME:
            raise SettingsError("LLM_MODEL_NAME must be set.")

        if self.LLM_MODEL_NAME not in litellm.model_list_set:
            raise SettingsError(f"Model {self.LLM_MODEL_NAME} is not supported.")

        if self.IS_OLLAMA_MODEL:
            if not self.OLLAMA_BASE_URL:
                raise SettingsError("OLLAMA_BASE_URL should be set for Ollama models.")

            return LLMProviderSettings(
                model=self.LLM_MODEL_NAME,
                api_base=self.OLLAMA_BASE_URL,
                api_key=None,
            )

        else:
            if not self.LLM_API_KEY:
                raise SettingsError("LLM_API_KEY must be set for non-ollama models.")

            return LLMProviderSettings(
                model=self.LLM_MODEL_NAME,
                api_key=self.LLM_API_KEY,
                api_base=None,
            )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
