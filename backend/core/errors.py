from fastapi import Request, status
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional

class AppError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, code: str = "BAD_REQUEST"):
        self.message = message
        self.status_code = status_code
        self.code = code

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND")

class AuthenticationError(AppError):
    def __init__(self, message: str = "Could not authenticate user"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED")

class PermissionDeniedError(AppError):
    def __init__(self, message: str = "Not enough permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN")

async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "code": exc.code,
            }
        },
    )
