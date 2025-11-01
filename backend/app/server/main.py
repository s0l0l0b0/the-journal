# backend/main.py

from contextlib import asynccontextmanager

from core.database import create_tables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from locallm.utils import ollama
from loguru import logger
from routers import llm, notes


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    await create_tables()
    global ollama_process

    if await ollama.is_ollama_running():
        logger.info("Ollama is already running.")
        ollama_process = None
    else:
        ollama_process = await ollama.start_ollama()

    yield

    print("Shutting down...")
    if ollama_process:
        await ollama.stop_ollama(ollama_process)


app = FastAPI(
    title="The Journal API",
    description="API for a simple note-taking application.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(llm.router)


@app.get("/", tags=["Root"])
async def read_root():
    return {"status": "The Journal API is running"}
