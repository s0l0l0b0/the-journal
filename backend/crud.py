# backend/crud.py

import sqlite3
from backend import schemas

def _dict_from_row(row: sqlite3.Row):
    """Helper function to convert a sqlite3.Row object to a dictionary."""
    if row is None:
        return None
    return dict(row)

def _dicts_from_rows(rows: list[sqlite3.Row]):
    """Helper function to convert a list of sqlite3.Row objects to a list of dictionaries."""
    return [_dict_from_row(row) for row in rows]

def create_note(conn: sqlite3.Connection, note: schemas.NoteCreate):
    """Inserts a new note into the database and returns it as a dict."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO notes (title, content) VALUES (?, ?)",
        (note.title, note.content or "")
    )
    new_note_id = cursor.lastrowid
    conn.commit()
    new_note_row = get_note_by_id(conn, new_note_id)
    return new_note_row # get_note_by_id now returns a dict

def get_all_notes(conn: sqlite3.Connection):
    """Fetches all active notes and returns them as a list of dicts."""
    rows = conn.execute("SELECT * FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC").fetchall()
    return _dicts_from_rows(rows)

def get_deleted_notes(conn: sqlite3.Connection):
    """Fetches all soft-deleted notes and returns them as a list of dicts."""
    rows = conn.execute("SELECT * FROM notes WHERE is_deleted = 1 ORDER BY updated_at DESC").fetchall()
    return _dicts_from_rows(rows)

def get_note_by_id(conn: sqlite3.Connection, note_id: int):
    """Fetches a single note by its ID and returns it as a dict."""
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return _dict_from_row(row)

def update_note(conn: sqlite3.Connection, note_id: int, note: schemas.NoteBase):
    """Updates a note and returns the updated note as a dict."""
    conn.execute(
        "UPDATE notes SET title = ?, content = ? WHERE id = ?",
        (note.title, note.content or "", note_id)
    )
    conn.commit()
    return get_note_by_id(conn, note_id)

def soft_delete_note(conn: sqlite3.Connection, note_id: int):
    """Marks a note as deleted."""
    conn.execute("UPDATE notes SET is_deleted = 1 WHERE id = ?", (note_id,))
    conn.commit()

def restore_note(conn: sqlite3.Connection, note_id: int):
    """Restores a note from the recycle bin."""
    conn.execute("UPDATE notes SET is_deleted = 0 WHERE id = ?", (note_id,))
    conn.commit()

def permanently_delete_note(conn: sqlite3.Connection, note_id: int):
    """Permanently deletes a note from the database."""
    conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()