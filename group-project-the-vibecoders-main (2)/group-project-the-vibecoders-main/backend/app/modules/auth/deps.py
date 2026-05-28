from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import decode_access_token
from app.modules.users.models import User
from app.shared.exception.auth_exception import UnauthorizedException, TokenExpiredException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user_id(token: str | None = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> str:
    if not token:
        raise UnauthorizedException()
        
    payload = decode_access_token(token)
    
    if not payload:
        raise UnauthorizedException()
        
    if isinstance(payload, dict) and "error" in payload:
        if payload["error"] == "Token has expired":
            raise TokenExpiredException()
        raise UnauthorizedException()
        
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException()
        
    return user_id
