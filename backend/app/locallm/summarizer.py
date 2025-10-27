from abc import ABC, abstractmethod


class Summarizer(ABC):
    @abstractmethod
    def summarize(self, text: str) -> str:
        """Generate a summary for the given text."""
        pass
