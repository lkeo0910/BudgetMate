from fastapi import APIRouter, HTTPException, Header, status
from app.models import UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
finance_router = APIRouter(tags=["finance"])


async def require_current_user_id(authorization: str | None) -> int:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

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

    return int(payload.get("sub"))


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
        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1",
            user_data.username,
        )
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )
        
        hashed_password = hash_password(user_data.password)
        inserted = await db.fetchrow(
            """
            INSERT INTO users (username, email, phone_number, avatar_url, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            """,
            user_data.username,
            user_data.email,
            user_data.phone_number,
            user_data.avatar_url,
            hashed_password,
        )
        user_id = inserted["id"]
        
        access_token = create_access_token(user_id, user_data.username)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                phone_number=user_data.phone_number,
                avatar_url=user_data.avatar_url,
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
        user = await db.fetchrow(
            "SELECT id, username, email, phone_number, avatar_url, password_hash FROM users WHERE username = $1",
            credentials.username,
        )
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        user_id = user["id"]
        username = user["username"]
        email = user["email"]
        phone_number = user["phone_number"]
        avatar_url = user["avatar_url"]
        password_hash = user["password_hash"]
        
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
                phone_number=phone_number,
                avatar_url=avatar_url,
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
    user_id = await require_current_user_id(authorization)
    db = get_db()
    
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Check server logs."
        )
    
    try:
        user = await db.fetchrow(
            "SELECT id, username, email, phone_number, avatar_url FROM users WHERE id = $1",
            user_id,
        )
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            phone_number=user["phone_number"],
            avatar_url=user["avatar_url"],
            created_at=None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@finance_router.get("/users/categories")
async def get_categories(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    rows = await db.fetch(
        """
        SELECT id, user_id, category_name, monthly_limit, category_type, category_icon, created_at, updated_at
        FROM categories
        WHERE user_id = $1
        ORDER BY category_type, category_name
        """,
        user_id,
    )
    return [dict(row) for row in rows]


@finance_router.get("/transactions")
async def get_transactions(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    rows = await db.fetch(
        """
        SELECT id, user_id, vendor, category_id, amount, date, type, notes, created_at, updated_at
        FROM transactions
        WHERE user_id = $1
        ORDER BY date DESC, created_at DESC
        """,
        user_id,
    )
    return [dict(row) for row in rows]
