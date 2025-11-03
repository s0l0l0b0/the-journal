from core.config import settings
from litellm import ModelResponse, completion
from loguru import logger


class LocalLMSummarizer:
    def summarize(self, text: str) -> str:
        response: ModelResponse = completion(
            model=settings.LLM_PROVIDER_SETTINGS.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes texts. While summarizing, ensure to retain all key points and present them concisely.",
                },
                {"role": "user", "content": text},
            ],
            api_key=settings.LLM_PROVIDER_SETTINGS.api_key,
            api_base=settings.LLM_PROVIDER_SETTINGS.api_base,
        )

        if response.choices is None or len(response.choices) == 0:
            raise ValueError("No response from the model.")

        logger.info(
            f"Model used for Summarizer: {response.model} | Token usage: {response.usage}"
        )

        return response.choices[0].message.content
