from fastapi import status
from app.shared.exception.handlers import BaseAPIException

class ChatSectionNotFoundException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="CHAT_SECTION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            message="Chat section not found or you don't have access to it."
        )

class ChatbotGeneralException(BaseAPIException):
    def __init__(self, message: str):
        super().__init__(
            error_id="CHATBOT_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message
        )
