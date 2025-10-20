# Backend Development

This is the FastAPI backend for The Journal.

## Setup

1. Create and activate a Python virtual environment (recommended):

    Using `uv`:
    ```bash
    uv venv --python 3.12
    source .venv/bin/activate
    ```

    Or using Python directly:
    ```bash
    python3.12 -m venv .venv
    source .venv/bin/activate
    ```

2. Install dependencies using [uv](https://github.com/astral-sh/uv):
    ```bash
    uv pip install -r pyproject.toml   
    ```
    This will install all dependencies specified in `pyproject.toml`.

3. Run the development server:
    ```bash
    uvicorn backend.main:app --reload
    ```

## Notes

- Requires Python 3.12 or higher.
- Make sure you have `uv` installed (`pip install uv` if needed).
- All dependencies (including `uvicorn` and `pydantic`) are managed via `pyproject.toml`.