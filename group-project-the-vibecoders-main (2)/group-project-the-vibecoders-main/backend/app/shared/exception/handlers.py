from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

class BaseAPIException(Exception):
    """Base class for all our custom API errors"""
    def __init__(self, error_id: str, status_code: int, message: str):
        self.error_id = error_id
        self.status_code = status_code
        self.message = message

    
def add_global_exception_handlers(app: FastAPI):
    
    @app.exception_handler(BaseAPIException)
    async def custom_exception_handler(request: Request, exc: BaseAPIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_id": exc.error_id,
                "message": exc.message,
                "status_code": exc.status_code
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        error_msg = exc.errors()[0].get("msg", "Validation error")
        
        # Pydantic v2 prepends "Value error, " to manually raised ValueErrors. We cleanly strip it.
        if error_msg.startswith("Value error, "):
            error_msg = error_msg.replace("Value error, ", "", 1)
            
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error_id": "VALIDATION_ERROR",
                "message": error_msg,
                "status_code": 422
            }
        )
