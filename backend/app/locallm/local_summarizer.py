from core.config import settings
from litellm import ModelResponse, completion


class LocalLMSummarizer:
    def summarize(self, text: str) -> str:
        response: ModelResponse = completion(
            model=settings.OLLAMA_MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes texts. While summarizing, ensure to retain all key points and present them concisely.",
                },
                {"role": "user", "content": text},
            ],
            api_base=settings.OLLAMA_BASE_URL,
        )

        if response.choices is None or len(response.choices) == 0:
            raise ValueError("No response from the model.")

        return response.choices[0].message.content
