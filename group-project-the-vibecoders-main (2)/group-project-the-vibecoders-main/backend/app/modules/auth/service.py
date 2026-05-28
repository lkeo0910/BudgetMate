from sqlmodel import Session, select
from fastapi import status
from app.modules.users.models import User, OTP
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    decode_refresh_token
)
from app.modules.auth.schemas import UserCreate, UserLogin, RegisterVerify, UserResponse
from app.modules.users.category_service import ensure_default_categories
from app.core.email import send_otp_email
from app.shared.exception.auth_exception import (
    UserAlreadyExistsException,
    InvalidCredentialsException,
    UserNotFoundException,
    InvalidOTPException,
    ExpiredOTPException,
    InvalidTokenException,
)
import random
import json
from app.core.redis import redis_client
from datetime import datetime, timedelta, timezone
from app.modules.auth.schemas import LoginResponse, AccessTokenResponse
def register_user(session: Session, user_in: UserCreate):
    statement = select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    existing_user = session.exec(statement).first()
    if existing_user:
        raise UserAlreadyExistsException()

    # Save to Redis! TTL 15 mins (900 seconds). Using namespaced key format.
    redis_key = f"{user_in.email}_register"
    user_in.password = get_password_hash(user_in.password)
    redis_client.set(redis_key, user_in.model_dump_json(), ex=900)

    # DO NOT persist User! Just send OTP and return stateless token wrapper
    code = f"{random.randint(100000, 999999)}"
    
    # Store OTP bound strictly by email
    statement_otp = select(OTP).where(OTP.email == user_in.email)
    otp = session.exec(statement_otp).first()
    if otp:
        otp.code = code
        otp.expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    else:
        otp = OTP(email=user_in.email, code=code, expires_at=datetime.now(timezone.utc) + timedelta(minutes=5))
        session.add(otp)
        
    session.commit()
    send_otp_email(user_in.email, code)
    
    return {"message": "OTP sent to email."}

def verify_registration_otp(session: Session, verify_in: RegisterVerify):
    email = verify_in.email
    redis_key = f"{email}_register"
    
    # Extract from Redis cache
    cached_payload = redis_client.get(redis_key)
    if not cached_payload:
        raise UserNotFoundException() # No pending registration found
        
    payload = json.loads(cached_payload)
    username = payload.get("username")
    
    
    # Check if duplicate crept in by same name while they were verifying
    existing_user = session.exec(select(User).where((User.username == username) | (User.email == email))).first()
    if existing_user:
         raise UserAlreadyExistsException()
         
    statement_otp = select(OTP).where(OTP.email == email)
    otp = session.exec(statement_otp).first()
    
    if not otp or otp.code != verify_in.code:
        raise InvalidOTPException()
        
    current_time = datetime.now(timezone.utc)
    if otp.expires_at.tzinfo is None:
        current_time = current_time.replace(tzinfo=None)
        
    if otp.expires_at < current_time:
        raise ExpiredOTPException()
        
    # Validation Passed -> Persist everything to DB mapping!
    user = User(
        username=username,
        email=email,
        password=payload.get("password"),
        profile_avatar=payload.get("profile_avatar"),
        phone_number=payload.get("phone_number")
    )
    session.add(user)
    session.delete(otp) # Consume OTP logic
    session.commit()
    session.refresh(user)
    ensure_default_categories(session, user.id)
    
    # Clean up Redis
    redis_client.delete(redis_key)
    
    return {"message": "User registered successfully. You may now log in."}

def login_user(session: Session, user_in: UserLogin) -> tuple[LoginResponse, str]:
    statement = select(User).where(User.username == user_in.username)
    user = session.exec(statement).first()
    if not user or not verify_password(user_in.password, user.password):
        raise InvalidCredentialsException()

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    user.refresh_token = refresh_token
    session.commit()
    session.refresh(user)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            profile_avatar=user.profile_avatar,
            phone_number=user.phone_number,
            
        )
    ), refresh_token
    
def refresh_access_token(session: Session, refresh_token: str) -> AccessTokenResponse:
    if not refresh_token:
        raise InvalidTokenException()
        
    payload = decode_refresh_token(refresh_token)
    if not payload:
        raise InvalidTokenException()
        
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenException()
        
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()
    
    if not user or user.refresh_token != refresh_token:
        raise InvalidTokenException()
        
    new_access_token = create_access_token(subject=user.id)
    
    return AccessTokenResponse(access_token=new_access_token)
def logout_user(session: Session, user_id: str):
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()
    if user:
        user.refresh_token = None
        session.add(user)
        session.commit()
    return {"message": "Logged out successfully"}
