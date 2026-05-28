import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from enum import Enum

if TYPE_CHECKING:
    from app.modules.transactions.models import Transaction


class CategoryType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class Category(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "category_name", name="unique_user_category"),)

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    category_name: str
    monthly_limit: Optional[float] = Field(default=None, nullable=True)
    category_type: CategoryType = Field(default=CategoryType.EXPENSE)
    category_icon: Optional[str] = Field(default="tag", nullable=True)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="categories")
    transactions: List["Transaction"] = Relationship(
        back_populates="category_obj",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class SavingsGoal(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    category_id: Optional[uuid.UUID] = Field(default=None, foreign_key="category.id", nullable=True)
    title: str
    target_amount: float
    initial_amount: float = Field(default=0)
    target_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="savings_goals")
    contributions: List["GoalContribution"] = Relationship(
        back_populates="goal",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class GoalContribution(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    goal_id: uuid.UUID = Field(foreign_key="savingsgoal.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    amount: float
    date: str
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    goal: Optional["SavingsGoal"] = Relationship(back_populates="contributions")
    user: Optional["User"] = Relationship(back_populates="goal_contributions")

class User(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(unique=True, index=True)
    password: str
    email: str = Field(unique=True, index=True)
    phone_number: Optional[str] = None
    profile_avatar: Optional[str] = None
    refresh_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    otp: Optional["OTP"] = Relationship(
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
        back_populates="user"
    )
    transactions: List["Transaction"] = Relationship(back_populates="user")
    categories: List["Category"] = Relationship(back_populates="user")
    savings_goals: List["SavingsGoal"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    goal_contributions: List["GoalContribution"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    budget_settings: Optional["UserBudgetSettings"] = Relationship(
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
        back_populates="user"
    )

class UserBudgetSettings(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    manual_available_amount: float = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="budget_settings")

class OTP(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    code: str = Field(max_length=6)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="otp")
