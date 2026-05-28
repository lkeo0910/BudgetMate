from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.core.database import get_session
from app.modules.auth.deps import get_current_user_id
from app.modules.auth.schemas import UserResponse
from app.modules.users.schemas import (
    BudgetSettingsResponse,
    BudgetSettingsUpdate,
    GoalContributionCreate,
    GoalContributionResponse,
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsGoalsStateResponse,
)
from app.modules.users.user_service import (
    create_goal_contribution,
    create_savings_goal,
    delete_savings_goal,
    get_or_create_budget_settings,
    get_savings_goals_state,
    get_user_by_id,
    update_budget_settings,
)

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return get_user_by_id(session, UUID(user_id))

@router.get("/budget-settings", response_model=BudgetSettingsResponse)
def get_budget_settings(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return get_or_create_budget_settings(session, UUID(user_id))

@router.put("/budget-settings", response_model=BudgetSettingsResponse)
def put_budget_settings(
    data: BudgetSettingsUpdate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return update_budget_settings(session, UUID(user_id), data)


@router.get("/savings-goals", response_model=SavingsGoalsStateResponse)
def get_savings_goals(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return get_savings_goals_state(session, UUID(user_id))


@router.post("/savings-goals", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def add_savings_goal(
    data: SavingsGoalCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return create_savings_goal(session, UUID(user_id), data)


@router.delete("/savings-goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_savings_goal(
    goal_id: UUID,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    delete_savings_goal(session, UUID(user_id), goal_id)


@router.post("/savings-goals/{goal_id}/contributions", response_model=GoalContributionResponse, status_code=status.HTTP_201_CREATED)
def add_goal_contribution(
    goal_id: UUID,
    data: GoalContributionCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return create_goal_contribution(session, UUID(user_id), goal_id, data)
