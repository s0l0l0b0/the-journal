# backend/routers/notes.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import sqlite3
from backend import crud, schemas, database # ABSOLUTE imports

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)

# Dependency to get a DB connection for each request
def get_db():
    conn = database.get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("", response_model=List[schemas.Note])
def read_notes(conn: sqlite3.Connection = Depends(get_db)):
    """Retrieve all active notes."""
    return crud.get_all_notes(conn)

@router.get("/deleted", response_model=List[schemas.Note])
def read_deleted_notes(conn: sqlite3.Connection = Depends(get_db)):
    """Retrieve all soft-deleted notes (recycle bin)."""
    return crud.get_deleted_notes(conn)

@router.post("", response_model=schemas.Note, status_code=status.HTTP_201_CREATED)
def create_new_note(note: schemas.NoteCreate, conn: sqlite3.Connection = Depends(get_db)):
    """Create a new note."""
    return crud.create_note(conn=conn, note=note)

@router.put("/{note_id}", response_model=schemas.Note)
def update_existing_note(note_id: int, note: schemas.NoteBase, conn: sqlite3.Connection = Depends(get_db)):
    """Update a note's title and content."""
    db_note = crud.get_note_by_id(conn, note_id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return crud.update_note(conn=conn, note_id=note_id, note=note)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def move_note_to_recycle_bin(note_id: int, conn: sqlite3.Connection = Depends(get_db)):
    """Soft delete a note (move to recycle bin)."""
    crud.soft_delete_note(conn=conn, note_id=note_id)
    return None

@router.put("/{note_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_note_from_recycle_bin(note_id: int, conn: sqlite3.Connection = Depends(get_db)):
    """Restore a note from the recycle bin."""
    crud.restore_note(conn=conn, note_id=note_id)
    return None

@router.delete("/{note_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def delete_note_permanently(note_id: int, conn: sqlite3.Connection = Depends(get_db)):
    """Permanently delete a note from the database."""
    crud.permanently_delete_note(conn=conn, note_id=note_id)
    return None