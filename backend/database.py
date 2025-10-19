import sqlite3
import os

# Define the database file path in the project's root directory.
# This ensures the path is correct regardless of where the script is run from.
DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "journal.db")

def get_db_connection():
    """Establishes and returns a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH)
    # This allows accessing columns by their names, e.g., row['title']
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    """Creates the 'notes' table and a trigger to update the 'updated_at' timestamp."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # The schema for our notes table.
    # - is_deleted acts as a boolean for our recycle bin (0=False, 1=True).
    # - Timestamps are stored in ISO 8601 format.
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

    # This trigger automatically updates the 'updated_at' field whenever a row is modified.
    # This is a robust way to track changes without needing to manage it in our application code.
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
    print("Database and tables initialized successfully.")