from fastapi import APIRouter, HTTPException, Header, status
from app.models import UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Check server logs."
        )
    
    try:
        # Check if user exists
        cursor = await db.execute(
            "SELECT id FROM users WHERE username = ?",
            (user_data.username,)
        )
        existing_user = await cursor.fetchone()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )
        
        # Create user
        hashed_password = hash_password(user_data.password)
        cursor = await db.execute(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (user_data.username, user_data.email, hashed_password)
        )
        user_id = cursor.lastrowid
        await db.commit()
        
        access_token = create_access_token(user_id, user_data.username)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                created_at=None
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with username and password"""
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Check server logs."
        )
    
    try:
        cursor = await db.execute(
            "SELECT id, username, email, password_hash FROM users WHERE username = ?",
            (credentials.username,)
        )
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        user_id, username, email, password_hash = user
        
        if not verify_password(credentials.password, password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        access_token = create_access_token(user_id, username)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                username=username,
                email=email,
                created_at=None
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(None)):
    """Get current logged-in user"""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )
    
    # Extract token from "Bearer TOKEN"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    
    user_id = int(payload.get("sub"))
    db = get_db()
    
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Check server logs."
        )
    
    try:
        cursor = await db.execute(
            "SELECT id, username, email FROM users WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        user_id, username, email = user
        return UserResponse(
            id=user_id,
            username=username,
            email=email,
            created_at=None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
