# Backend Development

This is the FastAPI backend for The Journal.

## Setup

1. Install [uv](https://github.com/astral-sh/uv) if you don't already have it installed in your system.

2. Create and activate a Python virtual environment installing necessary dependencies:

    Using `uv`:
    ```bash
    uv sync
    source .venv/bin/activate
    ```
    This will install all dependencies specified in `pyproject.toml` and actiavte the virtualenv.

3. Run the development server:
- First go to the root of `backend` directory with `cd backend`
- Run the fastapi server in development mode using `uv run uvicorn app.server.main:app --reload`
- This will hot reload new changes automatically

## Notes

- Requires Python 3.12 or higher.
- Make sure you have `uv` installed (`pip install uv` if needed).
- All dependencies are managed via `pyproject.toml`.