from uuid import UUID
from sqlmodel import Session, select
from datetime import datetime, timezone
from app.modules.users.models import GoalContribution, SavingsGoal, User, UserBudgetSettings
from app.modules.users.schemas import (
    BudgetSettingsUpdate,
    GoalContributionCreate,
    SavingsGoalCreate,
    SavingsGoalsStateResponse,
)
from app.shared.exception.auth_exception import UserNotFoundException

def get_user_by_id(session: Session, user_id: UUID) -> User:
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()
    if not user:
        raise UserNotFoundException()
    return user

def get_or_create_budget_settings(session: Session, user_id: UUID) -> UserBudgetSettings:
    statement = select(UserBudgetSettings).where(UserBudgetSettings.user_id == user_id)
    settings = session.exec(statement).first()

    if settings:
        return settings

    settings = UserBudgetSettings(user_id=user_id, manual_available_amount=0)
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings

def update_budget_settings(session: Session, user_id: UUID, data: BudgetSettingsUpdate) -> UserBudgetSettings:
    settings = get_or_create_budget_settings(session, user_id)
    settings.manual_available_amount = data.manual_available_amount
    settings.updated_at = datetime.now(timezone.utc)
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings


def get_savings_goals_state(session: Session, user_id: UUID) -> SavingsGoalsStateResponse:
    goals = session.exec(
        select(SavingsGoal).where(SavingsGoal.user_id == user_id).order_by(SavingsGoal.created_at.desc())
    ).all()
    contributions = session.exec(
        select(GoalContribution).where(GoalContribution.user_id == user_id).order_by(GoalContribution.created_at.desc())
    ).all()
    return SavingsGoalsStateResponse(goals=goals, contributions=contributions)


def ensure_goal_category(session: Session, user_id: UUID, title: str) -> UUID:
    from app.modules.users.models import Category, CategoryType
    from app.modules.users.category_service import infer_category_icon

    statement = select(Category).where(
        Category.user_id == user_id,
        Category.category_name.ilike(title.strip())
    )
    category = session.exec(statement).first()
    if not category:
        category_icon = infer_category_icon(title, CategoryType.EXPENSE)
        category = Category(
            user_id=user_id,
            category_name=title.strip(),
            monthly_limit=0,
            category_type=CategoryType.EXPENSE,
            category_icon=category_icon
        )
        session.add(category)
        session.commit()
        session.refresh(category)
    return category.id


def create_savings_goal(session: Session, user_id: UUID, data: SavingsGoalCreate) -> SavingsGoal:
    from app.shared.exception.savings_goal_exception import SavingsGoalAlreadyExistsException
    
    # Check if a savings goal with the same title already exists for this user (case-insensitive)
    existing_goal = session.exec(
        select(SavingsGoal).where(
            SavingsGoal.user_id == user_id,
            SavingsGoal.title.ilike(data.title.strip())
        )
    ).first()
    if existing_goal:
        raise SavingsGoalAlreadyExistsException()

    category_id = ensure_goal_category(session, user_id, data.title)
    goal = SavingsGoal(
        user_id=user_id,
        category_id=category_id,
        **data.model_dump()
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


def delete_savings_goal(session: Session, user_id: UUID, goal_id: UUID):
    from app.shared.exception.savings_goal_exception import SavingsGoalNotFoundException
    goal = session.exec(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
    ).first()
    if not goal:
        raise SavingsGoalNotFoundException()

    # Store references for cascading deletion
    category_id = goal.category_id
    goal_title = goal.title

    # 1. Delete the goal first to clear foreign key references
    session.delete(goal)
    session.commit()

    # 2. Find and delete the associated category
    category_to_delete = None
    from app.modules.users.models import Category
    if category_id:
        category_to_delete = session.exec(
            select(Category).where(Category.id == category_id, Category.user_id == user_id)
        ).first()

    # Fallback lookup in case category_id was not set (legacy goals)
    if not category_to_delete:
        category_to_delete = session.exec(
            select(Category).where(Category.user_id == user_id, Category.category_name.ilike(goal_title.strip()))
        ).first()

    if category_to_delete:
        session.delete(category_to_delete)
        session.commit()


def create_goal_contribution(
    session: Session,
    user_id: UUID,
    goal_id: UUID,
    data: GoalContributionCreate,
) -> GoalContribution:
    from app.shared.exception.savings_goal_exception import SavingsGoalNotFoundException
    goal = session.exec(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
    ).first()
    if not goal:
        raise SavingsGoalNotFoundException()

    # 1. Resolve/ensure category_id is mapped to the goal
    category_id = goal.category_id
    if not category_id:
        category_id = ensure_goal_category(session, user_id, goal.title)
        goal.category_id = category_id
        session.add(goal)
        session.commit()
        session.refresh(goal)

    # 2. Parse date string to datetime.date object
    try:
        from datetime import datetime
        contribution_date = datetime.strptime(data.date, "%Y-%m-%d").date()
    except Exception:
        import datetime as dt
        contribution_date = dt.date.today()

    # 3. Save a transaction in the database
    from app.modules.transactions.models import Transaction, TransactionType
    transaction = Transaction(
        user_id=user_id,
        vendor="goal",
        category_id=category_id,
        amount=data.amount,
        date=contribution_date,
        type=TransactionType.EXPENSE,
        notes=f"Goal contribution for {goal.title}"
    )
    session.add(transaction)

    # 4. Save the contribution record
    contribution = GoalContribution(
        user_id=user_id,
        goal_id=goal_id,
        **data.model_dump(),
    )
    session.add(contribution)
    session.commit()
    session.refresh(contribution)
    return contribution
