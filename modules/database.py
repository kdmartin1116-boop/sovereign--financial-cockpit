import sqlite3
import os

DATABASE_PATH = os.path.join(os.getcwd(), 'app_database.db')

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stored_filename TEXT NOT NULL UNIQUE,
            original_filename TEXT NOT NULL,
            type TEXT NOT NULL,
            date_added TEXT NOT NULL
        );
    """)
    
    # Create user_profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY,
            name TEXT,
            address TEXT,
            email TEXT,
            phone TEXT
        );
    """)
    
    # Check if a default profile exists, if not, create one
    cursor.execute("SELECT COUNT(*) FROM user_profile WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO user_profile (id, name, address, email, phone)
            VALUES (1, '', '', '', '')
        """)

    conn.commit()
    conn.close()

def add_document(stored_filename, original_filename, doc_type, date_added):
    """Adds a new document record to the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO documents (stored_filename, original_filename, type, date_added)
            VALUES (?, ?, ?, ?)
        """, (stored_filename, original_filename, doc_type, date_added))
        conn.commit()
    finally:
        conn.close()

def get_all_documents():
    """Retrieves all document records from the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT stored_filename, original_filename, type, date_added FROM documents ORDER BY date_added DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def delete_document(stored_filename):
    """Deletes a document record from the database by its stored filename."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM documents WHERE stored_filename = ?", (stored_filename,))
        conn.commit()
    finally:
        conn.close()

# --- Profile Functions ---

def get_profile():
    """Retrieves the user profile from the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, address, email, phone FROM user_profile WHERE id = 1")
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def save_profile(name, address, email, phone):
    """Saves or updates the user profile in the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO user_profile (id, name, address, email, phone)
            VALUES (1, ?, ?, ?, ?)
        """, (name, address, email, phone))
        conn.commit()
    finally:
        conn.close()