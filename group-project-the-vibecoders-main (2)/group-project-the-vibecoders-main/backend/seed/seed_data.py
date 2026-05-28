import json
import os
from datetime import datetime
from uuid import UUID
from sqlmodel import Session, select, func
from app.core.security import get_password_hash
from app.modules.users.models import User, Category, CategoryType
from app.modules.transactions.models import Transaction, TransactionType
from app.modules.transactions.service import create_transaction
from app.modules.transactions.schemas import TransactionCreate
from app.modules.users.category_service import ensure_default_categories

def ensure_seeded_transactions(session: Session, user_id: UUID):
    """Seed transactions from seed_data.json using category name-to-id mapping."""
    # Check if user already has transactions
    count = session.exec(select(func.count()).select_from(Transaction).where(Transaction.user_id == user_id)).one()
    if count > 0:
        print("Transactions already seeded, skipping...")
        return

    # Get all categories for this user
    categories = session.exec(select(Category).where(Category.user_id == user_id)).all()
    if not categories:
        print("No categories found, skipping transaction seeding...")
        return

    # Create category name to id mapping
    category_map = {c.category_name: c.id for c in categories}
    
    # Load transactions from JSON file
    seed_file_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    
    if not os.path.exists(seed_file_path):
        print(f"seed_data.json not found at {seed_file_path}")
        return

    try:
        with open(seed_file_path, 'r', encoding='utf-8') as f:
            transactions_data = json.load(f)
    except Exception as e:
        print(f"Error loading seed_data.json: {e}")
        return

    print(f"Seeding {len(transactions_data)} transactions for user {user_id}...")

    for trans_data in transactions_data:
        try:
            # Get category id from name
            category_name = trans_data.get("category")
            category_id = category_map.get(category_name)
            
            if not category_id:
                print(f"Warning: Category '{category_name}' not found, skipping transaction...")
                continue
            
            # Parse transaction data
            trans_type = TransactionType[trans_data.get("type", "EXPENSE")]
            trans_date = datetime.strptime(trans_data.get("date"), "%Y-%m-%d").date()
            
            transaction_create = TransactionCreate(
                vendor=trans_data.get("vendor"),
                category_id=category_id,
                amount=float(trans_data.get("amount", 0)),
                date=trans_date,
                type=trans_type,
                notes=trans_data.get("notes", "")
            )
            
            create_transaction(session, user_id, transaction_create)
        except Exception as e:
            print(f"Failed to insert seed transaction: {e}")
            
    print("Transaction seeding completed.")

def seed_initial_data(session: Session):
    """
    Seed initial data for the application, including a default test user,
    default categories, and sample transactions.
    """
    fixed_user_id = UUID("d47f0e26-9677-44d0-a283-c4111cf6bff8")
    test_user = session.exec(select(User).where(User.id == fixed_user_id)).first()
    
    if not test_user:
        hashed_pw = get_password_hash("password123")
        test_user = User(
            id=fixed_user_id,
            username="testuser",
            email="test@example.com",
            password=hashed_pw
        )
        session.add(test_user)
        session.commit()
        print(f"Default user 'testuser' seeded with fixed ID: {fixed_user_id}")
    
    session.refresh(test_user)
    
    # Seed categories and transactions for the user
    ensure_default_categories(session, test_user.id)
    ensure_seeded_transactions(session, test_user.id)
