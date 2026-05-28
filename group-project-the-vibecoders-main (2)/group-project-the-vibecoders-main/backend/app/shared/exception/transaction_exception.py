from fastapi import status
from app.shared.exception.handlers import BaseAPIException

class TransactionNotFoundException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="TRANSACTION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            message="Transaction not found"
        )


class ReceiptOCRNotConfiguredException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="OCR_NOT_CONFIGURED",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="Receipt OCR is not configured on the server",
        )


class UnsupportedReceiptFileException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="OCR_UNSUPPORTED_FILE",
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Only PDF, JPG, JPEG, PNG, and WEBP receipts are supported",
        )


class ReceiptFileTooLargeException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="OCR_FILE_TOO_LARGE",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            message="Receipt file is too large. Maximum supported size is 5MB",
        )


class ReceiptOCRProcessingException(BaseAPIException):
    def __init__(self, message: str = "Failed to process receipt OCR"):
        super().__init__(
            error_id="OCR_PROCESSING_FAILED",
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
        )
