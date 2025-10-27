from core.config import settings
from litellm import ModelResponse, completion
from locallm.summarizer import Summarizer


class LocalLMSummarizer(Summarizer):
    def summarize(self, text: str) -> str:
        response: ModelResponse = completion(
            model="ollama/qwen3:0.6b",
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


if __name__ == "__main__":
    summarizer = LocalLMSummarizer()

    # Resolve the test data file relative to this source file
    from pathlib import Path

    data_path = Path(__file__).resolve().parent / "summarizer-test-data.txt"
    if not data_path.exists():
        raise FileNotFoundError(f"Test data not found: {data_path}")

    # Read the test data
    with data_path.open("r", encoding="utf-8") as file:
        text = file.read()

    print(f"Read {len(text)} characters from {data_path}")

    # Attempt to summarize but guard against runtime errors (missing model, network, etc.)
    try:
        result = summarizer.summarize(text)
        print("Summary:", result)
    except Exception as e:
        # Don't raise here — the main goal was to read the file. Provide useful debug info.
        print("Could not run summarizer:", e)
