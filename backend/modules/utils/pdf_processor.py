from pypdf import PdfReader
from werkzeug.datastructures import FileStorage


def extract_text_from_pdf(file: FileStorage) -> str | None:
    """
    Extracts all text content from an uploaded PDF file.

    Args:
        file: A FileStorage object from request.files.

    Returns:
        A string containing the extracted text, or None if text extraction fails.
    """
    try:
        text = ""
        # The file stream needs to be reset before reading, as it might have been read before.
        file.seek(0)
        reader = PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ""

        if not text.strip():
            return None

        return text
    except Exception as e:
        # In a real application, you'd want to log this error.
        print(f"Error extracting text from PDF: {e}")
        return None
