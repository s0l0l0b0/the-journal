# backend/database.py

import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "journal.db")

def get_db_connection():
    """Establishes a connection to the SQLite database and returns the connection object."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    """Creates the 'notes' table and a trigger to update the 'updated_at' timestamp."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            is_deleted INTEGER NOT NULL DEFAULT 0
        )
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS update_notes_updated_at
        AFTER UPDATE ON notes
        FOR EACH ROW
        BEGIN
            UPDATE notes
            SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = OLD.id;
        END;
    """)
    conn.commit()
    conn.close()
    print("Database and tables verified successfully.")