from datetime import datetime, timedelta, timezone
import hmac

from passlib.context import CryptContext
from jose import JWTError, jwt
from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if pwd_context.identify(hashed_password):
        return pwd_context.verify(plain_password, hashed_password)
    return hmac.compare_digest(plain_password, hashed_password)


def password_needs_rehash(stored_password: str) -> bool:
    return not pwd_context.identify(stored_password) or pwd_context.needs_update(stored_password)


def create_access_token(user_id: int, username: str) -> str:
    to_encode = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    }
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
