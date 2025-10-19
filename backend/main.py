from contextlib import asynccontextmanager
from fastapi import FastAPI
import database # Import our database module

# Create a FastAPI application instance
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    database.create_tables()
    yield
    # Shutdown code (if needed)

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    """A simple root endpoint to confirm the API is running."""
    return {"status": "The Journal API is running"}