from pydantic import BaseModel, Field


class SummarizerRequest(BaseModel):
    text: str = Field(..., description="The text to be summarized.")


class SummarizerResponse(BaseModel):
    summary: str = Field(..., description="The summarized text.")
