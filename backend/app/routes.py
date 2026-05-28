from fastapi import APIRouter, HTTPException, Header, status
from app.models import UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.database import get_pg_pool

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate):
    """Register a new user"""
    pool = get_pg_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Check if user exists
    async with pool.acquire() as conn:
        existing_user = await conn.fetchrow(
            "SELECT id FROM users WHERE username = $1",
            user_data.username
        )
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )
        
        # Create user
        hashed_password = hash_password(user_data.password)
        user = await conn.fetchrow(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at
            """,
            user_data.username,
            user_data.email,
            hashed_password
        )
    
    access_token = create_access_token(user["id"], user["username"])
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with username and password"""
    pool = get_pg_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1",
            credentials.username
        )
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(user["id"], user["username"])
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"]
        )
    )


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
    pool = get_pg_pool()
    
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            user_id
        )
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return UserResponse(**user)
