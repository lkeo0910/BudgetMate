from fastapi import status
from app.shared.exception.handlers import BaseAPIException

class CategoryNotFoundException(BaseAPIException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_id="CATEGORY_NOT_FOUND",
            message="Category not found or does not belong to the user"
        )

class CategoryAlreadyExistsException(BaseAPIException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_id="CATEGORY_ALREADY_EXISTS",
            message="A category with this name already exists for this user"
        )
