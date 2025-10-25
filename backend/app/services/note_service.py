# backend/crud.py

from typing import List, Optional

from app.schemas import schemas
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _to_dict_from_mapping(mapping) -> Optional[dict]:
    if mapping is None:
        return None
    return dict(mapping)


async def create_note(conn: AsyncSession, note: schemas.NoteCreate) -> dict:
    """Insert a new note and return it as a dict."""
    await conn.execute(
        text("INSERT INTO notes (title, content) VALUES (:title, :content)"),
        {"title": note.title, "content": note.content or ""},
    )
    await conn.commit()

    last = await conn.execute(text("SELECT last_insert_rowid() AS id"))
    last_id = last.scalar_one()
    return await get_note_by_id(conn, last_id)


async def get_all_notes(conn: AsyncSession) -> List[dict]:
    result = await conn.execute(
        text("SELECT * FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC")
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


async def get_deleted_notes(conn: AsyncSession) -> List[dict]:
    result = await conn.execute(
        text("SELECT * FROM notes WHERE is_deleted = 1 ORDER BY updated_at DESC")
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


async def get_note_by_id(conn: AsyncSession, note_id: int) -> Optional[dict]:
    result = await conn.execute(
        text("SELECT * FROM notes WHERE id = :id"), {"id": note_id}
    )
    rows = result.mappings().all()
    if not rows:
        return None
    return dict(rows[0])


async def update_note(
    conn: AsyncSession, note_id: int, note: schemas.NoteBase
) -> Optional[dict]:
    await conn.execute(
        text("UPDATE notes SET title = :title, content = :content WHERE id = :id"),
        {"title": note.title, "content": note.content or "", "id": note_id},
    )
    await conn.commit()
    return await get_note_by_id(conn, note_id)


async def soft_delete_note(conn: AsyncSession, note_id: int) -> None:
    await conn.execute(
        text("UPDATE notes SET is_deleted = 1 WHERE id = :id"), {"id": note_id}
    )
    await conn.commit()


async def restore_note(conn: AsyncSession, note_id: int) -> None:
    await conn.execute(
        text("UPDATE notes SET is_deleted = 0 WHERE id = :id"), {"id": note_id}
    )
    await conn.commit()


async def permanently_delete_note(conn: AsyncSession, note_id: int) -> None:
    await conn.execute(text("DELETE FROM notes WHERE id = :id"), {"id": note_id})
    await conn.commit()
