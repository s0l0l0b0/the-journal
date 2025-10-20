# backend/main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core import database  # ABSOLUTE import
from backend.routers import notes  # ABSOLUTE import


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    await database.create_tables()
    yield
    print("Shutting down...")


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


@app.get("/", tags=["Root"])
async def read_root():
    return {"status": "The Journal API is running"}
