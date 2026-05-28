from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.modules.users.models import CategoryType

class CategoryBase(BaseModel):
    category_name: str
    monthly_limit: Optional[float] = None
    category_type: CategoryType = CategoryType.EXPENSE
    category_icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    monthly_limit: Optional[float] = None
    category_type: Optional[CategoryType] = None
    category_icon: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetSettingsBase(BaseModel):
    manual_available_amount: float = 0

class BudgetSettingsUpdate(BudgetSettingsBase):
    pass

class BudgetSettingsResponse(BudgetSettingsBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SavingsGoalBase(BaseModel):
    title: str
    target_amount: float
    initial_amount: float = 0
    target_date: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalResponse(SavingsGoalBase):
    id: UUID
    user_id: UUID
    category_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalContributionBase(BaseModel):
    amount: float
    date: str
    note: Optional[str] = None


class GoalContributionCreate(GoalContributionBase):
    pass


class GoalContributionResponse(GoalContributionBase):
    id: UUID
    goal_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsGoalsStateResponse(BaseModel):
    goals: List[SavingsGoalResponse]
    contributions: List[GoalContributionResponse]
