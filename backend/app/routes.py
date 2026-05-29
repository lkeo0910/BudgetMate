from fastapi import APIRouter, HTTPException, Header, status
from app.models import CategoryCreate, CategoryUpdate, TransactionCreate, TransactionUpdate, UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.database import get_db
from app.seed_data import ensure_default_categories

router = APIRouter(prefix="/auth", tags=["auth"])
finance_router = APIRouter(tags=["finance"])


TRANSACTION_COLUMNS = "id, user_id, vendor, category_id, amount, date, type, notes, created_at, updated_at"
CATEGORY_COLUMNS = "id, user_id, category_name, monthly_limit, category_type, category_icon, created_at, updated_at"


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


async def ensure_user_category(db, user_id: int, category_id: int):
    category = await db.fetchrow(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        category_id,
        user_id,
    )
    if not category:
        raise HTTPException(status_code=400, detail="Category does not belong to this user")


async def get_user_category(db, user_id: int, category_id: int):
    category = await db.fetchrow(
        f"""
        SELECT {CATEGORY_COLUMNS}
        FROM categories
        WHERE id = $1 AND user_id = $2
        """,
        category_id,
        user_id,
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return dict(category)


async def get_user_transaction(db, user_id: int, transaction_id: int):
    transaction = await db.fetchrow(
        f"""
        SELECT {TRANSACTION_COLUMNS}
        FROM transactions
        WHERE id = $1 AND user_id = $2
        """,
        transaction_id,
        user_id,
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return dict(transaction)


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
        await ensure_default_categories(db, user_id)
        
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

        await ensure_default_categories(db, user_id)
        
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

    await ensure_default_categories(db, user_id)
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


@finance_router.post("/categories", status_code=status.HTTP_201_CREATED)
@finance_router.post("/users/categories", status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    try:
        row = await db.fetchrow(
            f"""
            INSERT INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING {CATEGORY_COLUMNS}
            """,
            user_id,
            category.category_name,
            category.monthly_limit,
            category.category_type,
            category.category_icon,
        )
        return dict(row)
    except Exception as exc:
        if "UNIQUE" in str(exc).upper() or "unique" in str(exc):
            raise HTTPException(status_code=400, detail="Category name already exists")
        raise


@finance_router.get("/categories/{category_id}")
@finance_router.get("/users/categories/{category_id}")
async def get_category(category_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    return await get_user_category(db, user_id, category_id)


@finance_router.patch("/categories/{category_id}")
@finance_router.put("/categories/{category_id}")
@finance_router.put("/users/categories/{category_id}")
async def update_category(category_id: int, category: CategoryUpdate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    await get_user_category(db, user_id, category_id)
    updates = category.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No category fields provided")

    set_parts = []
    values = []
    for index, (field, value) in enumerate(updates.items(), start=1):
        set_parts.append(f"{field} = ${index}")
        values.append(value)

    values.extend([category_id, user_id])
    category_id_param = len(values) - 1
    user_id_param = len(values)
    try:
        row = await db.fetchrow(
            f"""
            UPDATE categories
            SET {", ".join(set_parts)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${category_id_param} AND user_id = ${user_id_param}
            RETURNING {CATEGORY_COLUMNS}
            """,
            *values,
        )
        return dict(row)
    except Exception as exc:
        if "UNIQUE" in str(exc).upper() or "unique" in str(exc):
            raise HTTPException(status_code=400, detail="Category name already exists")
        raise


@finance_router.delete("/categories/{category_id}")
@finance_router.delete("/users/categories/{category_id}")
async def delete_category(category_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    existing = await get_user_category(db, user_id, category_id)
    row = await db.fetchrow(
        """
        DELETE FROM categories
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """,
        category_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    try:
        await db.execute(
            """
            INSERT INTO hidden_default_categories (user_id, category_name)
            VALUES ($1, $2)
            """,
            user_id,
            existing["category_name"],
        )
    except Exception:
        pass
    return {"deleted": True, "id": row["id"]}


@finance_router.get("/transactions")
@finance_router.get("/transactions/")
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


@finance_router.post("/transactions", status_code=status.HTTP_201_CREATED)
@finance_router.post("/transactions/", status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    await ensure_user_category(db, user_id, transaction.category_id)
    row = await db.fetchrow(
        f"""
        INSERT INTO transactions (user_id, vendor, category_id, amount, date, type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING {TRANSACTION_COLUMNS}
        """,
        user_id,
        transaction.vendor,
        transaction.category_id,
        transaction.amount,
        transaction.date.isoformat(),
        transaction.type,
        transaction.notes,
    )
    return dict(row)


@finance_router.get("/transactions/{transaction_id}")
async def get_transaction(transaction_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    return await get_user_transaction(db, user_id, transaction_id)


@finance_router.patch("/transactions/{transaction_id}")
@finance_router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: int, transaction: TransactionUpdate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    await get_user_transaction(db, user_id, transaction_id)
    updates = transaction.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No transaction fields provided")
    if "category_id" in updates:
        await ensure_user_category(db, user_id, updates["category_id"])
    if "date" in updates and updates["date"] is not None:
        updates["date"] = updates["date"].isoformat()

    set_parts = []
    values = []
    for index, (field, value) in enumerate(updates.items(), start=1):
        set_parts.append(f"{field} = ${index}")
        values.append(value)

    values.extend([transaction_id, user_id])
    transaction_id_param = len(values) - 1
    user_id_param = len(values)
    row = await db.fetchrow(
        f"""
        UPDATE transactions
        SET {", ".join(set_parts)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${transaction_id_param} AND user_id = ${user_id_param}
        RETURNING {TRANSACTION_COLUMNS}
        """,
        *values,
    )
    return dict(row)


@finance_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    row = await db.fetchrow(
        """
        DELETE FROM transactions
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """,
        transaction_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True, "id": row["id"]}
