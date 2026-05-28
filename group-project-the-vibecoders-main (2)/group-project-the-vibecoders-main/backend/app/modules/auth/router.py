from fastapi import APIRouter, Depends, Response, Cookie
from sqlmodel import Session
from app.core.database import get_session
from app.modules.auth.schemas import (
    UserCreate, 
    UserLogin, 
    RegisterVerify, 
    AccessTokenResponse,
    LoginResponse
)
from app.modules.auth.service import (
    register_user, 
    login_user, 
    verify_registration_otp, 
    refresh_access_token,
    logout_user
)
from app.modules.auth.deps import get_current_user_id

router = APIRouter()

@router.post("/register")
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    return register_user(session, user_in)

@router.post("/verify-register-otp")
def verify_register_otp(verify_in: RegisterVerify, session: Session = Depends(get_session)):
    return verify_registration_otp(session, verify_in)

@router.post("/login", response_model=LoginResponse)
def login(user_in: UserLogin, response: Response, session: Session = Depends(get_session)):
    login_response, refresh_token = login_user(session, user_in)
    
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, max_age=7 * 24 * 60 * 60,
        samesite="lax", secure=False 
    )
    
    return login_response

@router.post("/logout")
def logout(
    response: Response, 
    user_id: str = Depends(get_current_user_id), 
    session: Session = Depends(get_session)
):
    logout_user(session, user_id)
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.post("/refresh-token", response_model=AccessTokenResponse)
def refresh_token_endpoint(
    refresh_token: str | None = Cookie(None), 
    session: Session = Depends(get_session)
):
    return refresh_access_token(session, refresh_token)
