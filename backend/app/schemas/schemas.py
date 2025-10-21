# backend/schemas.py

from pydantic import BaseModel
from typing import Optional

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    created_at: str
    updated_at: str
    is_deleted: int

    class Config:
        orm_mode = True