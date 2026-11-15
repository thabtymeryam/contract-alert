"""
Utility functions for file upload handling.
"""
import os
import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile


UPLOAD_BASE_DIR = "uploads"
CONTRACTS_DIR = f"{UPLOAD_BASE_DIR}/contracts"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

# Saved names look like "<32 hex chars>_<original name>.pdf"
_UUID_PREFIX = re.compile(r"^[0-9a-f]{32}_")


def validate_pdf(file: UploadFile) -> None:
    """Validate that the uploaded file is a PDF (by content type and file signature)."""
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )
    if file.file.read(5) != b"%PDF-":
        raise HTTPException(status_code=400, detail="The file is not a valid PDF")
    file.file.seek(0)


def _safe_name(filename: str | None) -> str:
    """Keep only the base name and safe characters, so the client can't choose the save location."""
    name = Path(filename or "contract.pdf").name
    name = re.sub(r"[^\w.\- ]", "_", name).strip(" .") or "contract.pdf"
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name[:150]


def display_name(file_path: str) -> str:
    """The original file name, without the unique prefix."""
    return _UUID_PREFIX.sub("", Path(file_path).name)


def save_contract_file(file: UploadFile) -> str:
    """
    Save an uploaded contract file and return its path.

    Every file gets a unique prefix, so two uploads with the same name
    never overwrite each other.

    Returns:
        The relative file path where the file was saved
    """
    validate_pdf(file)

    Path(CONTRACTS_DIR).mkdir(parents=True, exist_ok=True)
    file_path = f"{CONTRACTS_DIR}/{uuid.uuid4().hex}_{_safe_name(file.filename)}"

    written = 0
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            written += len(chunk)
            if written > MAX_UPLOAD_BYTES:
                buffer.close()
                os.remove(file_path)
                raise HTTPException(status_code=413, detail="The PDF is larger than 20 MB")
            buffer.write(chunk)

    return file_path


def delete_contract_file(file_path: str | None) -> None:
    """Remove a stored contract file, ignoring files that are already gone."""
    if not file_path:
        return
    full_path = os.path.join("/app", file_path.lstrip("/"))
    if os.path.exists(full_path):
        os.remove(full_path)
