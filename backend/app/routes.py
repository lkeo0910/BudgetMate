import base64
import binascii
from datetime import date
import math
from pathlib import Path
import re

from fastapi import APIRouter, HTTPException, Header, Query, status
from app.core.config import get_settings
from app.models import (
    CategoryCreate,
    CategoryUpdate,
    ChangePasswordRequest,
    ChatRequest,
    ChatSectionCreate,
    ChatSectionUpdate,
    GoalContributionCreate,
    ProfilePhotoUpload,
    PushTokenDeleteRequest,
    PushTokenRequest,
    SavingsGoalCreate,
    TransactionCreate,
    TransactionUpdate,
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
    UserSettingsUpdate,
)
from app.auth import hash_password, verify_password, password_needs_rehash, create_access_token, decode_token
from app.database import get_db
from app.seed_data import ensure_default_categories

router = APIRouter(prefix="/auth", tags=["auth"])
finance_router = APIRouter(tags=["finance"])
settings = get_settings()


TRANSACTION_COLUMNS = "id, user_id, vendor, category_id, goal_id, amount, date, type, notes, created_at, updated_at"
CATEGORY_COLUMNS = "id, user_id, category_name, monthly_limit, category_type, category_icon, created_at, updated_at"
GOAL_COLUMNS = "id, user_id, category_id, title, target_amount, initial_amount, target_date, created_at, updated_at"
CONTRIBUTION_COLUMNS = "id, goal_id, user_id, transaction_id, amount, date, note, created_at"
CHAT_SECTION_COLUMNS = "id, user_id, name, created_at, updated_at"
PUSH_TOKEN_COLUMNS = "id, user_id, device_token, platform, created_at, updated_at, last_used_at"
UPLOAD_ROOT = Path(settings.upload_dir)
if not UPLOAD_ROOT.is_absolute():
    UPLOAD_ROOT = Path(__file__).resolve().parents[1] / UPLOAD_ROOT
PROFILE_PHOTO_ROOT = UPLOAD_ROOT / "profile_photos"
STRONG_PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$")


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

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_db()
    if db:
        user = await db.fetchrow("SELECT id FROM users WHERE id = $1", user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

    return user_id


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


def api_error_message(exc: Exception, fallback: str) -> str:
    text = str(exc)
    return text if text else fallback


def detect_image_mime(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


def extension_for_mime(mime_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }[mime_type]


def row_to_goal(row) -> dict:
    goal = dict(row)
    goal["id"] = str(goal["id"])
    goal["user_id"] = str(goal["user_id"])
    if goal.get("category_id") is not None:
        goal["category_id"] = str(goal["category_id"])
    return goal


def row_to_contribution(row) -> dict:
    contribution = dict(row)
    contribution["id"] = str(contribution["id"])
    contribution["goal_id"] = str(contribution["goal_id"])
    contribution["user_id"] = str(contribution["user_id"])
    if contribution.get("transaction_id") is not None:
        contribution["transaction_id"] = str(contribution["transaction_id"])
    return contribution


def row_to_section_summary(row) -> dict:
    section = dict(row)
    return {
        "section_id": str(section["id"]),
        "name": section.get("name"),
        "date": section.get("updated_at") or section.get("created_at"),
    }


def row_to_push_token(row) -> dict:
    token = dict(row)
    token["id"] = str(token["id"])
    token["user_id"] = str(token["user_id"])
    return token


async def get_user_goal(db, user_id: int, goal_id: int):
    row = await db.fetchrow(
        f"""
        SELECT {GOAL_COLUMNS}
        FROM savings_goals
        WHERE id = $1 AND user_id = $2
        """,
        goal_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return dict(row)


async def get_or_create_goal_category(db, user_id: int, title: str) -> int:
    existing = await db.fetchrow(
        """
        SELECT id
        FROM categories
        WHERE user_id = $1 AND LOWER(category_name) = LOWER($2)
        """,
        user_id,
        title,
    )
    if existing:
        return existing["id"]

    row = await db.fetchrow(
        """
        INSERT INTO categories (user_id, category_name, monthly_limit, category_type, category_icon)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        """,
        user_id,
        title,
        None,
        "expense",
        "flag-outline",
    )
    return row["id"]


async def resolve_transaction_goal(db, user_id: int, category_id: int | None, transaction_type: str, requested_goal_id: int | None = None):
    if transaction_type != "EXPENSE" or not requested_goal_id:
        return None

    return await get_user_goal(db, user_id, requested_goal_id)


async def sync_goal_contribution_for_transaction(db, user_id: int, transaction: dict, requested_goal_id: int | None = None):
    existing = await db.fetchrow(
        """
        SELECT id
        FROM savings_goal_contributions
        WHERE user_id = $1 AND transaction_id = $2
        """,
        user_id,
        transaction["id"],
    )
    effective_goal_id = requested_goal_id if requested_goal_id is not None else transaction.get("goal_id")
    goal = await resolve_transaction_goal(
        db,
        user_id,
        transaction.get("category_id"),
        transaction.get("type"),
        effective_goal_id,
    )

    if not goal:
        if existing:
            await db.execute(
                """
                DELETE FROM savings_goal_contributions
                WHERE id = $1 AND user_id = $2
                """,
                existing["id"],
                user_id,
            )
        return None

    note = transaction.get("notes") or f"Savings goal contribution: {goal['title']}"
    if existing:
        row = await db.fetchrow(
            f"""
            UPDATE savings_goal_contributions
            SET goal_id = $1, amount = $2, date = $3, note = $4
            WHERE id = $5 AND user_id = $6
            RETURNING {CONTRIBUTION_COLUMNS}
            """,
            goal["id"],
            transaction["amount"],
            transaction["date"],
            note,
            existing["id"],
            user_id,
        )
        return row_to_contribution(row)

    row = await db.fetchrow(
        f"""
        INSERT INTO savings_goal_contributions (goal_id, user_id, transaction_id, amount, date, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {CONTRIBUTION_COLUMNS}
        """,
        goal["id"],
        user_id,
        transaction["id"],
        transaction["amount"],
        transaction["date"],
        note,
    )
    return row_to_contribution(row)


async def ensure_user_settings(db, user_id: int):
    settings = await db.fetchrow(
        """
        SELECT user_id, preferred_currency, created_at, updated_at
        FROM user_settings
        WHERE user_id = $1
        """,
        user_id,
    )
    if settings:
        return dict(settings)

    row = await db.fetchrow(
        """
        INSERT INTO user_settings (user_id, preferred_currency)
        VALUES ($1, $2)
        RETURNING user_id, preferred_currency, created_at, updated_at
        """,
        user_id,
        "vnd",
    )
    return dict(row)


def parse_positive_int(value: str, name: str) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"Invalid {name}")
    if number <= 0:
        raise HTTPException(status_code=400, detail=f"Invalid {name}")
    return number


async def build_chat_response(db, user_id: int, message: str) -> str:
    rows = await db.fetch(
        """
        SELECT t.amount, t.type, t.date, c.category_name
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = $1
        ORDER BY t.date DESC
        """,
        user_id,
    )
    transactions = [dict(row) for row in rows]
    income = sum(float(item["amount"] or 0) for item in transactions if item["type"] == "INCOME")
    expenses = sum(float(item["amount"] or 0) for item in transactions if item["type"] != "INCOME")
    balance = income - expenses
    lower = message.lower()

    category_totals: dict[str, float] = {}
    for item in transactions:
        if item["type"] == "INCOME":
            continue
        name = item.get("category_name") or "Uncategorized"
        category_totals[name] = category_totals.get(name, 0) + float(item["amount"] or 0)
    top_categories = sorted(category_totals.items(), key=lambda entry: entry[1], reverse=True)[:3]

    def money(value: float) -> str:
        return f"{value:,.0f} VND"

    if not transactions:
        return "I do not see any transactions yet. Add a few income and expense entries, then I can summarize cash flow, top categories, and budget pressure."

    if "spend" in lower or "expense" in lower or "category" in lower:
        if not top_categories:
            return "You have income recorded, but no spending yet. Add expenses to see category trends."
        category_text = ", ".join(f"{name}: {money(total)}" for name, total in top_categories)
        return f"Your top expense categories are {category_text}. Total spending is {money(expenses)}, so start with the largest category for the quickest improvement."

    if "income" in lower or "salary" in lower or "earn" in lower:
        return f"Recorded income totals {money(income)}. After {money(expenses)} in expenses, your net balance is {money(balance)}."

    if "budget" in lower or "save" in lower or "saving" in lower:
        savings_rate = (balance / income * 100) if income else 0
        return f"Your savings rate is about {max(savings_rate, 0):.0f}%. A practical next move is to assign limits to the top spending categories and review them weekly."

    return f"Here is the current snapshot: income {money(income)}, expenses {money(expenses)}, net balance {money(balance)}. Ask about spending, income, savings, or budget categories for a deeper breakdown."


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
        if not STRONG_PASSWORD_PATTERN.match(user_data.password):
            raise HTTPException(
                status_code=400,
                detail="Password must be 8+ characters and include a letter, number, and special character",
            )

        existing_user = await db.fetchrow(
            "SELECT id FROM users WHERE username = $1",
            user_data.username,
        )
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Account could not be created with those details"
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
    except Exception:
        raise HTTPException(status_code=500, detail="Could not create account")


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

        if password_needs_rehash(password_hash):
            await db.execute(
                """
                UPDATE users
                SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                """,
                hash_password(credentials.password),
                user_id,
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
    except Exception:
        raise HTTPException(status_code=500, detail="Could not sign in")


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
    except Exception:
        raise HTTPException(status_code=500, detail="Could not load current user")


@finance_router.get("/users/me", response_model=UserResponse)
async def get_current_user_alias(authorization: str = Header(None)):
    return await get_current_user(authorization)


@finance_router.patch("/users/me", response_model=UserResponse)
async def update_current_user(update: UserSettingsUpdate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    updates = {}
    if update.phone_number is not None:
        updates["phone_number"] = update.phone_number
    if update.avatar_url is not None:
        updates["avatar_url"] = update.avatar_url

    if updates:
        set_parts = []
        values = []
        for index, (field, value) in enumerate(updates.items(), start=1):
            set_parts.append(f"{field} = ${index}")
            values.append(value)
        values.append(user_id)
        await db.execute(
            f"""
            UPDATE users
            SET {", ".join(set_parts)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${len(values)}
            """,
            *values,
        )

    return await get_current_user(authorization)


@finance_router.get("/users/settings")
async def get_current_user_settings(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")
    settings = await ensure_user_settings(db, user_id)
    return {
        "user_id": str(settings["user_id"]),
        "preferred_currency": settings["preferred_currency"],
        "created_at": settings["created_at"],
        "updated_at": settings["updated_at"],
    }


@finance_router.put("/users/settings")
async def update_current_user_settings(update: UserSettingsUpdate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    await ensure_user_settings(db, user_id)
    if update.preferred_currency:
        await db.execute(
            """
            UPDATE user_settings
            SET preferred_currency = $1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
            """,
            update.preferred_currency,
            user_id,
        )
    if update.phone_number is not None or update.avatar_url is not None:
        await update_current_user(update, authorization)

    return await get_current_user_settings(authorization)


@finance_router.put("/users/password")
async def change_password(payload: ChangePasswordRequest, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    if not STRONG_PASSWORD_PATTERN.match(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="New password must be 8+ characters and include a letter, number, and special character",
        )
    if payload.confirm_new_password is not None and payload.new_password != payload.confirm_new_password:
        raise HTTPException(status_code=400, detail="New password and confirmation must match")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from the current password")

    user = await db.fetchrow(
        "SELECT password_hash FROM users WHERE id = $1",
        user_id,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    await db.execute(
        """
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        """,
        hash_password(payload.new_password),
        user_id,
    )
    return {"updated": True}


@finance_router.post("/users/profile-photo", response_model=UserResponse)
async def upload_profile_photo(payload: ProfilePhotoUpload, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    image_base64 = payload.image_base64.strip()
    if "," in image_base64 and image_base64.lower().startswith("data:image/"):
        image_base64 = image_base64.split(",", 1)[1]

    try:
        content = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Profile photo data is not a valid image upload")

    if not content:
        raise HTTPException(status_code=400, detail="Profile photo is empty")
    if len(content) > settings.max_profile_photo_bytes:
        raise HTTPException(status_code=400, detail="Profile photo must be 5MB or smaller")

    declared_mime = "image/jpeg" if payload.mime_type == "image/jpg" else payload.mime_type
    detected_mime = detect_image_mime(content)
    if not detected_mime:
        raise HTTPException(status_code=400, detail="Profile photo must be a JPG, PNG, or WEBP image")
    if detected_mime != declared_mime:
        raise HTTPException(status_code=400, detail="Profile photo type does not match the uploaded image")

    extension = extension_for_mime(detected_mime)
    PROFILE_PHOTO_ROOT.mkdir(parents=True, exist_ok=True)
    photo_path = PROFILE_PHOTO_ROOT / f"user_{user_id}.{extension}"
    photo_path.write_bytes(content)
    avatar_url = f"/uploads/profile_photos/{photo_path.name}"

    await db.execute(
        """
        UPDATE users
        SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        """,
        avatar_url,
        user_id,
    )
    return await get_current_user(authorization)


@finance_router.get("/users/push-tokens")
async def get_push_tokens(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    rows = await db.fetch(
        f"""
        SELECT {PUSH_TOKEN_COLUMNS}
        FROM push_tokens
        WHERE user_id = $1
        ORDER BY last_used_at DESC, updated_at DESC
        """,
        user_id,
    )
    return [row_to_push_token(row) for row in rows]


@finance_router.post("/users/push-tokens", status_code=status.HTTP_201_CREATED)
async def register_push_token(payload: PushTokenRequest, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    row = await db.fetchrow(
        f"""
        INSERT INTO push_tokens (user_id, device_token, platform, last_used_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, device_token)
        DO UPDATE SET platform = excluded.platform, updated_at = CURRENT_TIMESTAMP, last_used_at = CURRENT_TIMESTAMP
        RETURNING {PUSH_TOKEN_COLUMNS}
        """,
        user_id,
        payload.device_token,
        payload.platform,
    )
    return row_to_push_token(row)


@finance_router.put("/users/push-tokens", status_code=status.HTTP_200_OK)
async def update_push_token(payload: PushTokenRequest, authorization: str = Header(None)):
    return await register_push_token(payload, authorization)


@finance_router.delete("/users/push-tokens")
async def delete_push_token(payload: PushTokenDeleteRequest, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    row = await db.fetchrow(
        """
        DELETE FROM push_tokens
        WHERE user_id = $1 AND device_token = $2
        RETURNING id
        """,
        user_id,
        payload.device_token,
    )
    return {"deleted": bool(row)}


@finance_router.delete("/users/push-tokens/{token_id}")
async def delete_push_token_by_id(token_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    row = await db.fetchrow(
        """
        DELETE FROM push_tokens
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """,
        token_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Push token not found")
    return {"deleted": True, "id": str(row["id"])}


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
    transaction_rows = await db.fetch(
        """
        SELECT id
        FROM transactions
        WHERE category_id = $1 AND user_id = $2
        """,
        category_id,
        user_id,
    )
    for transaction in transaction_rows:
        await db.execute(
            """
            DELETE FROM savings_goal_contributions
            WHERE transaction_id = $1 AND user_id = $2
            """,
            transaction["id"],
            user_id,
        )
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
async def get_transactions(
    authorization: str = Header(None),
    page: int | None = Query(None, ge=1),
    size: int | None = Query(None, ge=1, le=500),
    orderBy: str = Query("date", pattern="^(date|amount|vendor|created_at)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    sort_column = {
        "date": "date",
        "amount": "amount",
        "vendor": "vendor",
        "created_at": "created_at",
    }[orderBy]
    sort_direction = "ASC" if order.lower() == "asc" else "DESC"
    rows = await db.fetch(
        f"""
        SELECT {TRANSACTION_COLUMNS}
        FROM transactions
        WHERE user_id = $1
        ORDER BY {sort_column} {sort_direction}, created_at DESC
        """,
        user_id,
    )
    items = [dict(row) for row in rows]
    if page is None and size is None:
        return items

    page_number = page or 1
    page_size = size or 50
    start = (page_number - 1) * page_size
    end = start + page_size
    total = len(items)
    return {
        "items": items[start:end],
        "total": total,
        "page": page_number,
        "size": page_size,
        "pages": max(1, math.ceil(total / page_size)),
    }


@finance_router.post("/transactions", status_code=status.HTTP_201_CREATED)
@finance_router.post("/transactions/", status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    category_id = transaction.category_id
    if transaction.goal_id:
        if transaction.type != "EXPENSE":
            raise HTTPException(status_code=400, detail="Only expense transactions can be linked to a savings goal")
        goal = await get_user_goal(db, user_id, transaction.goal_id)
        category_id = goal.get("category_id") or await get_or_create_goal_category(db, user_id, goal["title"])
    await ensure_user_category(db, user_id, category_id)
    row = await db.fetchrow(
        f"""
        INSERT INTO transactions (user_id, vendor, category_id, goal_id, amount, date, type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING {TRANSACTION_COLUMNS}
        """,
        user_id,
        transaction.vendor,
        category_id,
        transaction.goal_id,
        transaction.amount,
        transaction.date.isoformat(),
        transaction.type,
        transaction.notes,
    )
    await sync_goal_contribution_for_transaction(db, user_id, dict(row), transaction.goal_id)
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

    existing_transaction = await get_user_transaction(db, user_id, transaction_id)
    updates = transaction.model_dump(exclude_unset=True)
    goal_was_provided = "goal_id" in updates
    requested_goal_id = updates.pop("goal_id", None)
    if not updates and not goal_was_provided:
        raise HTTPException(status_code=400, detail="No transaction fields provided")
    if requested_goal_id:
        goal = await get_user_goal(db, user_id, requested_goal_id)
        updates["category_id"] = goal.get("category_id") or await get_or_create_goal_category(db, user_id, goal["title"])
        updates["goal_id"] = requested_goal_id
    elif goal_was_provided:
        updates["goal_id"] = None
    effective_type = updates.get("type") or existing_transaction.get("type")
    effective_goal_id = requested_goal_id if requested_goal_id else (None if goal_was_provided else existing_transaction.get("goal_id"))
    if effective_goal_id and effective_type != "EXPENSE":
        raise HTTPException(status_code=400, detail="Only expense transactions can be linked to a savings goal")
    if "category_id" in updates:
        await ensure_user_category(db, user_id, updates["category_id"])
    if "date" in updates and updates["date"] is not None:
        updates["date"] = updates["date"].isoformat()

    if updates:
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
        transaction_row = dict(row)
    else:
        transaction_row = existing_transaction

    await sync_goal_contribution_for_transaction(
        db,
        user_id,
        transaction_row,
        requested_goal_id if goal_was_provided else None,
    )
    return transaction_row


@finance_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    await db.execute(
        """
        DELETE FROM savings_goal_contributions
        WHERE transaction_id = $1 AND user_id = $2
        """,
        transaction_id,
        user_id,
    )
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


@finance_router.get("/users/savings-goals")
async def get_savings_goals(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    goals = await db.fetch(
        f"""
        SELECT {GOAL_COLUMNS}
        FROM savings_goals
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        user_id,
    )
    contributions = await db.fetch(
        f"""
        SELECT {CONTRIBUTION_COLUMNS}
        FROM savings_goal_contributions
        WHERE user_id = $1
        ORDER BY date DESC, created_at DESC
        """,
        user_id,
    )
    return {
        "goals": [row_to_goal(row) for row in goals],
        "contributions": [row_to_contribution(row) for row in contributions],
    }


@finance_router.post("/users/savings-goals", status_code=status.HTTP_201_CREATED)
async def create_savings_goal(goal: SavingsGoalCreate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    if goal.initial_amount > goal.target_amount:
        raise HTTPException(status_code=400, detail="Already saved cannot be greater than target amount")
    if goal.target_date and goal.target_date < date.today():
        raise HTTPException(status_code=400, detail="Target date must be today or later")

    category_id = await get_or_create_goal_category(db, user_id, goal.title.strip())
    row = await db.fetchrow(
        f"""
        INSERT INTO savings_goals (user_id, category_id, title, target_amount, initial_amount, target_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {GOAL_COLUMNS}
        """,
        user_id,
        category_id,
        goal.title.strip(),
        goal.target_amount,
        goal.initial_amount,
        goal.target_date.isoformat() if goal.target_date else None,
    )
    return row_to_goal(row)


@finance_router.delete("/users/savings-goals/{goal_id}")
async def delete_savings_goal(goal_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    goal = await get_user_goal(db, user_id, goal_id)
    try:
        contribution_rows = await db.fetch(
            """
            SELECT transaction_id
            FROM savings_goal_contributions
            WHERE goal_id = $1 AND user_id = $2 AND transaction_id IS NOT NULL
            """,
            goal_id,
            user_id,
        )
    except Exception:
        contribution_rows = []
    for contribution_row in contribution_rows:
        await db.execute(
            """
            DELETE FROM transactions
            WHERE id = $1 AND user_id = $2
            """,
            contribution_row["transaction_id"],
            user_id,
        )
    await db.execute(
        """
        DELETE FROM savings_goal_contributions
        WHERE goal_id = $1 AND user_id = $2
        """,
        goal_id,
        user_id,
    )
    row = await db.fetchrow(
        """
        DELETE FROM savings_goals
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """,
        goal_id,
        user_id,
    )
    if goal.get("category_id"):
        transaction_count = await db.fetchrow(
            """
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE user_id = $1 AND category_id = $2
            """,
            user_id,
            goal["category_id"],
        )
        goal_count = await db.fetchrow(
            """
            SELECT COUNT(*) AS count
            FROM savings_goals
            WHERE user_id = $1 AND category_id = $2
            """,
            user_id,
            goal["category_id"],
        )
        if not transaction_count["count"] and not goal_count["count"]:
            await db.execute(
                """
                DELETE FROM categories
                WHERE id = $1 AND user_id = $2
                """,
                goal["category_id"],
                user_id,
            )
    return {"deleted": True, "id": str(row["id"])}


@finance_router.post("/users/savings-goals/{goal_id}/contributions", status_code=status.HTTP_201_CREATED)
async def create_goal_contribution(goal_id: int, contribution: GoalContributionCreate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    goal = await get_user_goal(db, user_id, goal_id)
    contribution_date = contribution.date or date.today()
    category_id = goal.get("category_id") or await get_or_create_goal_category(db, user_id, goal["title"])
    if not goal.get("category_id"):
        await db.execute(
            """
            UPDATE savings_goals
            SET category_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3
            """,
            category_id,
            goal_id,
            user_id,
        )

    transaction_row = await db.fetchrow(
        """
        INSERT INTO transactions (user_id, vendor, category_id, goal_id, amount, date, type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        """,
        user_id,
        goal["title"],
        category_id,
        goal_id,
        contribution.amount,
        contribution_date.isoformat(),
        "EXPENSE",
        contribution.note or f"Savings goal contribution: {goal['title']}",
    )
    row = await db.fetchrow(
        f"""
        INSERT INTO savings_goal_contributions (goal_id, user_id, transaction_id, amount, date, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {CONTRIBUTION_COLUMNS}
        """,
        goal_id,
        user_id,
        transaction_row["id"],
        contribution.amount,
        contribution_date.isoformat(),
        contribution.note,
    )
    return row_to_contribution(row)


@finance_router.post("/chatbot/sections", status_code=status.HTTP_201_CREATED)
async def create_chat_section(section: ChatSectionCreate | None = None, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    row = await db.fetchrow(
        f"""
        INSERT INTO chat_sections (user_id, name)
        VALUES ($1, $2)
        RETURNING {CHAT_SECTION_COLUMNS}
        """,
        user_id,
        section.name.strip() if section and section.name else None,
    )
    return row_to_section_summary(row)


@finance_router.get("/chatbot/sections")
async def get_chat_sections(authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    rows = await db.fetch(
        f"""
        SELECT {CHAT_SECTION_COLUMNS}
        FROM chat_sections
        WHERE user_id = $1
        ORDER BY updated_at DESC, created_at DESC
        """,
        user_id,
    )
    return [row_to_section_summary(row) for row in rows]


@finance_router.get("/chatbot/sections/{section_id}")
async def get_chat_section(section_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    section = await db.fetchrow(
        f"""
        SELECT {CHAT_SECTION_COLUMNS}
        FROM chat_sections
        WHERE id = $1 AND user_id = $2
        """,
        section_id,
        user_id,
    )
    if not section:
        raise HTTPException(status_code=404, detail="Chat section not found")

    messages = await db.fetch(
        """
        SELECT role, content, timestamp
        FROM chat_messages
        WHERE section_id = $1 AND user_id = $2
        ORDER BY timestamp ASC, id ASC
        """,
        section_id,
        user_id,
    )
    return {
        "section_id": str(section["id"]),
        "user_id": str(section["user_id"]),
        "name": section["name"],
        "messages": [dict(message) for message in messages],
        "created_at": section["created_at"],
        "updated_at": section["updated_at"],
    }


@finance_router.put("/chatbot/sections/{section_id}")
async def update_chat_section(section_id: int, update: ChatSectionUpdate, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    row = await db.fetchrow(
        f"""
        UPDATE chat_sections
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING {CHAT_SECTION_COLUMNS}
        """,
        update.name.strip(),
        section_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Chat section not found")
    return row_to_section_summary(row)


@finance_router.delete("/chatbot/sections/{section_id}")
async def delete_chat_section(section_id: int, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    row = await db.fetchrow(
        """
        DELETE FROM chat_sections
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """,
        section_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Chat section not found")
    return {"deleted": True, "id": str(row["id"])}


@finance_router.post("/chatbot/chat")
async def send_chat_message(request: ChatRequest, authorization: str = Header(None)):
    user_id = await require_current_user_id(authorization)
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable. Check server logs.")

    section_id = parse_positive_int(request.section_id, "section_id")
    section = await db.fetchrow(
        """
        SELECT id
        FROM chat_sections
        WHERE id = $1 AND user_id = $2
        """,
        section_id,
        user_id,
    )
    if not section:
        raise HTTPException(status_code=404, detail="Chat section not found")

    message = request.message.strip()
    await db.execute(
        """
        INSERT INTO chat_messages (section_id, user_id, role, content)
        VALUES ($1, $2, $3, $4)
        """,
        section_id,
        user_id,
        "user",
        message,
    )
    response = await build_chat_response(db, user_id, message)
    await db.execute(
        """
        INSERT INTO chat_messages (section_id, user_id, role, content)
        VALUES ($1, $2, $3, $4)
        """,
        section_id,
        user_id,
        "ai",
        response,
    )
    await db.execute(
        """
        UPDATE chat_sections
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        """,
        section_id,
        user_id,
    )
    return {"section_id": str(section_id), "response": response}
