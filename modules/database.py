import sqlite3

from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

    def get_id(self):
        return str(self.id)


def get_db_connection(database_path):
    return sqlite3.connect(database_path)


def init_db(app):
    """Initializes the database and creates tables if they don't exist."""
    database_path = app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    conn = get_db_connection(database_path)
    cursor = conn.cursor()

    # Create documents table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stored_filename TEXT NOT NULL UNIQUE,
            original_filename TEXT NOT NULL,
            type TEXT NOT NULL,
            date_added TEXT NOT NULL
        );
    """
    )

    # Create user_profile table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY,
            name TEXT,
            address TEXT,
            email TEXT,
            phone TEXT
        );
    """
    )

    # Create disputes table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            date_sent TEXT NOT NULL,
            status TEXT NOT NULL
        );
    """
    )

    # Create users table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
    """
    )

    # Check if a default profile exists, if not, create one
    cursor.execute("SELECT COUNT(*) FROM user_profile WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            """
            INSERT INTO user_profile (id, name, address, email, phone)
            VALUES (1, '', '', '', '')
        """
        )

    conn.commit()
    conn.close()


def add_document(database_path, stored_filename, original_filename, doc_type, date_added):
    """Adds a new document record to the database."""
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO documents (stored_filename, original_filename, type, date_added)
            VALUES (?, ?, ?, ?)
        """,
            (stored_filename, original_filename, doc_type, date_added),
        )
        conn.commit()
    finally:
        conn.close()


def get_all_documents(database_path):
    """Retrieves all document records from the database."""
    conn = get_db_connection(database_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT stored_filename, original_filename, type, date_added FROM documents ORDER BY date_added DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def delete_document(database_path, stored_filename):
    """Deletes a document record from the database by its stored filename."""
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM documents WHERE stored_filename = ?", (stored_filename,))
        conn.commit()
    finally:
        conn.close()


# --- Profile Functions ---


def get_profile(database_path):
    """Retrieves the user profile from the database."""
    conn = get_db_connection(database_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, address, email, phone FROM user_profile WHERE id = 1")
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def save_profile(database_path, name, address, email, phone):
    """Saves or updates the user profile in the database."""
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT OR REPLACE INTO user_profile (id, name, address, email, phone)
            VALUES (1, ?, ?, ?, ?)
        """,
            (name, address, email, phone),
        )
        conn.commit()
    finally:
        conn.close()


# --- Dispute Functions ---


def add_dispute(database_path, account_name, account_number, date_sent, status):
    """Adds a new dispute record to the database."""
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO disputes (account_name, account_number, date_sent, status)
            VALUES (?, ?, ?, ?)
        """,
            (account_name, account_number, date_sent, status),
        )
        conn.commit()
    finally:
        conn.close()


def get_all_disputes(database_path):
    """Retrieves all dispute records from the database."""
    conn = get_db_connection(database_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, account_name, account_number, date_sent, status FROM disputes ORDER BY date_sent DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def update_dispute_status(database_path, dispute_id, status):
    """Updates the status of a dispute record."""
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE disputes SET status = ? WHERE id = ?", (status, dispute_id))
        conn.commit()
    finally:
        conn.close()


# --- User Functions ---


def create_user(database_path, username, password_hash):
    conn = get_db_connection(database_path)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_user_by_username(database_path, username):
    conn = get_db_connection(database_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_data = cursor.fetchone()
        if user_data:
            return User(user_data["id"], user_data["username"], user_data["password_hash"])
        return None
    finally:
        conn.close()


def get_user_by_id(database_path, user_id):
    conn = get_db_connection(database_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_data = cursor.fetchone()
        if user_data:
            return User(user_data["id"], user_data["username"], user_data["password_hash"])
        return None
    finally:
        conn.close()
