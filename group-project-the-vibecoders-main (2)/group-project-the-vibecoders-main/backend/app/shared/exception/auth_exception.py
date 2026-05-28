from fastapi import status
from app.shared.exception.handlers import BaseAPIException

class UserAlreadyExistsException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="USER_ALREADY_EXIST",
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Username or email already registered"
        )

class InvalidCredentialsException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_INCORRECT_PASSWORD",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Incorrect username or password"
        )

class UserNotFoundException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="USER_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            message="User not found"
        )

class InvalidOTPException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_INVALID_OTP",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid OTP code"
        )

class ExpiredOTPException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_EXPIRED_OTP",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="OTP code expired"
        )

class InvalidTokenException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid or expired refresh token"
        )

class UnauthorizedException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Missing or invalid authentication credentials"
        )

class TokenExpiredException(BaseAPIException):
    def __init__(self):
        super().__init__(
            error_id="AUTH_TOKEN_EXPIRED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Access token has expired"
        )
