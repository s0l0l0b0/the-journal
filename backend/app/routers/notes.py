# backend/routers/notes.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_connection  # direct import for DI
from app.schemas import schemas
from app.services import note_service as crud

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)


# Dependency to get a DB connection for each request
# Using `get_db_connection` directly from `backend.core.database` for dependency injection.
# This returns an AsyncSession when awaited by FastAPI in async route handlers.


@router.get("", response_model=List[schemas.Note])
async def read_notes(conn: AsyncSession = Depends(get_db_connection)):
    """Retrieve all active notes."""
    return await crud.get_all_notes(conn)


@router.get("/deleted", response_model=List[schemas.Note])
async def read_deleted_notes(conn: AsyncSession = Depends(get_db_connection)):
    """Retrieve all soft-deleted notes (recycle bin)."""
    return await crud.get_deleted_notes(conn)


@router.post("", response_model=schemas.Note, status_code=status.HTTP_201_CREATED)
async def create_new_note(
    note: schemas.NoteCreate, conn: AsyncSession = Depends(get_db_connection)
):
    """Create a new note."""
    return await crud.create_note(conn=conn, note=note)


@router.put("/{note_id}", response_model=schemas.Note)
async def update_existing_note(
    note_id: int,
    note: schemas.NoteBase,
    conn: AsyncSession = Depends(get_db_connection),
):
    """Update a note's title and content."""
    db_note = await crud.get_note_by_id(conn, note_id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return await crud.update_note(conn=conn, note_id=note_id, note=note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def move_note_to_recycle_bin(
    note_id: int, conn: AsyncSession = Depends(get_db_connection)
):
    """Soft delete a note (move to recycle bin)."""
    await crud.soft_delete_note(conn=conn, note_id=note_id)
    return None


@router.put("/{note_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_note_from_recycle_bin(
    note_id: int, conn: AsyncSession = Depends(get_db_connection)
):
    """Restore a note from the recycle bin."""
    await crud.restore_note(conn=conn, note_id=note_id)
    return None


@router.delete("/{note_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_permanently(
    note_id: int, conn: AsyncSession = Depends(get_db_connection)
):
    """Permanently delete a note from the database."""
    await crud.permanently_delete_note(conn=conn, note_id=note_id)
    return None
