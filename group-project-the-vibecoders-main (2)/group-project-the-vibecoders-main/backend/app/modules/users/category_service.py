from uuid import UUID
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from app.modules.users.models import Category, CategoryType
from app.modules.users.schemas import CategoryCreate, CategoryUpdate
from app.shared.exception.category_exception import CategoryNotFoundException, CategoryAlreadyExistsException

DEFAULT_CATEGORY_SPECS = [
    {"category_name": "Groceries", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "shopping-cart"},
    {"category_name": "Rent", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "house"},
    {"category_name": "Transport", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "car"},
    {"category_name": "Utilities", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "receipt"},
    {"category_name": "Entertainment", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "film"},
    {"category_name": "Shopping", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "shopping-bag"},
    {"category_name": "Healthcare", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "heart-pulse"},
    {"category_name": "Goals", "monthly_limit": None, "category_type": CategoryType.EXPENSE, "category_icon": "piggy-bank"},
    {"category_name": "Salary", "monthly_limit": None, "category_type": CategoryType.INCOME, "category_icon": "banknote-arrow-up"},
    {"category_name": "Freelance", "monthly_limit": None, "category_type": CategoryType.INCOME, "category_icon": "briefcase"},
    {"category_name": "Other Income", "monthly_limit": None, "category_type": CategoryType.INCOME, "category_icon": "wallet"},
]

LEGACY_DEFAULT_LIMITS = {
    "Groceries": 500,
    "Rent": 1500,
    "Transport": 250,
    "Utilities": 300,
    "Entertainment": 200,
    "Shopping": 250,
    "Healthcare": 200,
}

def infer_category_icon(category_name: str, category_type: CategoryType) -> str:
    """Infer category icon based on name and type."""
    normalized = category_name.strip().lower()
    icon_map = {
        "groceries": "shopping-cart",
        "rent": "house",
        "transport": "car",
        "utilities": "receipt",
        "entertainment": "film",
        "shopping": "shopping-bag",
        "healthcare": "heart-pulse",
        "goals": "piggy-bank",
        "salary": "banknote-arrow-up",
        "freelance": "briefcase",
        "other income": "wallet",
        "food": "utensils-crossed",
        "travel": "plane",
        "education": "graduation-cap",
        "subscriptions": "tv",
        "savings": "landmark",
    }

    if normalized in icon_map:
        return icon_map[normalized]

    if category_type == CategoryType.INCOME:
        return "wallet"

    return "tag"

def ensure_default_categories(session: Session, user_id: UUID) -> list[Category]:
    """Ensure default categories exist for the user."""
    existing_categories = session.exec(
        select(Category).where(Category.user_id == user_id)
    ).all()
    if existing_categories:
        updated = False
        for category in existing_categories:
            legacy_limit = LEGACY_DEFAULT_LIMITS.get(category.category_name)
            if legacy_limit is not None and category.monthly_limit == legacy_limit:
                category.monthly_limit = None
                session.add(category)
                updated = True            
            if not category.category_icon:
                category.category_icon = infer_category_icon(category.category_name, category.category_type)
                session.add(category)
                updated = True

        if updated:
            session.commit()
            for category in existing_categories:
                session.refresh(category)
        return existing_categories

    created_categories: list[Category] = []
    for spec in DEFAULT_CATEGORY_SPECS:
        category = Category(user_id=user_id, **spec)
        session.add(category)
        created_categories.append(category)

    session.commit()

    for category in created_categories:
        session.refresh(category)

    return created_categories

def get_user_categories(session: Session, user_id: UUID) -> list[Category]:
    statement = select(Category).where(Category.user_id == user_id)
    return session.exec(statement).all()


def create_category(session: Session, user_id: UUID, data: CategoryCreate) -> Category:
    try:
        payload = data.model_dump()
        db_obj = Category(**payload, user_id=user_id)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj
    except IntegrityError:
        session.rollback()
        raise CategoryAlreadyExistsException()

def update_category(session: Session, category_id: UUID, user_id: UUID, data: CategoryUpdate) -> Category:
    statement = select(Category).where(Category.id == category_id, Category.user_id == user_id)
    category = session.exec(statement).first()
    
    if not category:
        raise CategoryNotFoundException()

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
        
    try:
        session.add(category)
        session.commit()
        session.refresh(category)
        return category
    except IntegrityError:
        session.rollback()
        raise CategoryAlreadyExistsException()

def delete_category(session: Session, category_id: UUID, user_id: UUID):
    statement = select(Category).where(Category.id == category_id, Category.user_id == user_id)
    category = session.exec(statement).first()
    
    if not category:
        raise CategoryNotFoundException()
        
    session.delete(category)
    session.commit()
