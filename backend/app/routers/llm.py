from fastapi import APIRouter, Depends
from locallm.local_summarizer import LocalLMSummarizer
from schemas.llm import SummarizerRequest, SummarizerResponse

router = APIRouter(prefix="/api/v1/llm/summarize", tags=["LLM"])


@router.post("/", response_model=SummarizerResponse)
async def summarize_text(
    request: SummarizerRequest, summarizer=Depends(LocalLMSummarizer)
):
    """
    Endpoint to summarize text using the local LLM summarizer.
    """

    summary = summarizer.summarize(request.text)
    return SummarizerResponse(summary=summary)
