"""
Receipt Upload Validation Service.

Responsibilities:
- Validate the uploaded file is an image (no PDFs accepted).
- Enforce size limits.
"""

from pathlib import Path

from app.shared.exception.transaction_exception import (
    ReceiptFileTooLargeException,
    ReceiptOCRProcessingException,
    UnsupportedReceiptFileException,
)

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # Increased to 10 MB for high-res images

# Images only
SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def validate_image_upload(
    *,
    filename: str,
    content_type: str | None,
    file_bytes: bytes,
) -> None:
    """
    Ensure the upload is a non-empty image within the size limit.
    """
    suffix = Path(filename or "").suffix.lower()
    is_image_content_type = bool(content_type and content_type.startswith("image/"))

    if suffix not in SUPPORTED_IMAGE_EXTENSIONS and not is_image_content_type:
        raise UnsupportedReceiptFileException()

    if not file_bytes:
        raise ReceiptOCRProcessingException("Uploaded receipt is empty")

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise ReceiptFileTooLargeException()
