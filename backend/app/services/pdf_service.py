import logging

from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Open a PDF file and return all its text as a single string.
    Each page's text is separated by a newline.
    """
    logger.info("Reading PDF: %s", file_path)

    reader = PdfReader(file_path)
    pages_text = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text:
            pages_text.append(f"--- Page {page_number} ---\n{text}")
            logger.info("  Page %d: extracted %d characters", page_number, len(text))
        else:
            logger.warning("  Page %d: no text found", page_number)

    full_text = "\n\n".join(pages_text)
    logger.info("PDF total: %d pages, %d characters extracted", len(reader.pages), len(full_text))
    return full_text
