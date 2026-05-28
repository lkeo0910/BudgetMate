from fastapi import status
from app.shared.exception.handlers import BaseAPIException

class SavingsGoalAlreadyExistsException(BaseAPIException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_id="SAVINGS_GOAL_ALREADY_EXISTS",
            message="A savings goal with this title already exists for this user"
        )

class SavingsGoalNotFoundException(BaseAPIException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_id="SAVINGS_GOAL_NOT_FOUND",
            message="Savings goal not found or does not belong to the user"
        )
