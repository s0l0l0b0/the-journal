# backend/database.py


from typing import AsyncGenerator

from app.core.config import settings
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

engine: AsyncEngine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncLocalSession = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db_connection() -> AsyncGenerator[AsyncSession, None]:
    """Establishes a connection to the SQLite database and returns the connection object."""
    async with AsyncLocalSession() as session:
        yield session


async def create_tables():
    """Creates the 'notes' table and a trigger to update the 'updated_at' timestamp."""

    def _create_tables(conn):
        conn.exec_driver_sql("""
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                is_deleted INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.exec_driver_sql("""
            CREATE TRIGGER IF NOT EXISTS update_notes_updated_at
            AFTER UPDATE ON notes
            FOR EACH ROW
            BEGIN
                UPDATE notes
                SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                WHERE id = OLD.id;
            END;
        """)

    async with engine.begin() as conn:
        await conn.run_sync(_create_tables)
        print("Database and tables verified successfully.")
