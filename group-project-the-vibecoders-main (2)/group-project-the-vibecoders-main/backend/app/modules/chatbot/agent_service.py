import json
import datetime
import logging
from uuid import UUID
from typing import List, Optional, Any
from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.runnables import RunnableConfig, RunnableLambda
from langchain_mongodb import MongoDBChatMessageHistory
from sqlmodel import Session, select, func, and_

from app.core.config import settings
from app.core.ai import llm, embeddings
from app.core.mongodb import get_sync_mongodb_db
from app.core.database import engine
from app.modules.users.category_service import get_user_categories
from app.modules.transactions.service import get_transactions, get_transaction_by_id
from app.modules.transactions.schemas import TransactionFilters
from app.modules.transactions.models import Transaction
from app.modules.users.models import Category, SavingsGoal, GoalContribution, UserBudgetSettings
from app.modules.users.user_service import get_savings_goals_state

# Set up logging
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tools (Using independent sessions to avoid concurrency issues)
# ---------------------------------------------------------------------------

@tool
def get_categories(config: RunnableConfig) -> str:
    """Get all spending and income categories for the user."""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        categories = get_user_categories(session, user_id)
        return json.dumps([{"id": str(c.id), "name": c.category_name, "type": c.category_type} for c in categories])

@tool
def filter_transactions(
    config: RunnableConfig,
    search: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
) -> str:
    """Filter transactions using specific criteria. Dates should be YYYY-MM-DD."""
    user_id = config["configurable"]["user_id"]
    filters = TransactionFilters(
        search=search,
        type=type,
        category_id=UUID(category_id) if category_id else None,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        size=100
    )
    with Session(engine) as session:
        result = get_transactions(session, user_id, filters)
        return json.dumps([{"id": str(t.id), "vendor": t.vendor, "amount": t.amount, "date": str(t.date)} for t in result.items])

@tool
def get_spending_by_vendor(config: RunnableConfig, date_from: Optional[str] = None, date_to: Optional[str] = None) -> str:
    """Get a summary of spending grouped by vendor. Useful for 'Where do I spend most?'"""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        query = select(Transaction.vendor, func.sum(Transaction.amount).label("total"), func.count(Transaction.id).label("count")) \
            .where(Transaction.user_id == user_id, Transaction.type == "EXPENSE")
        
        if date_from:
            query = query.where(Transaction.date >= datetime.date.fromisoformat(date_from))
        if date_to:
            query = query.where(Transaction.date <= datetime.date.fromisoformat(date_to))
            
        query = query.group_by(Transaction.vendor).order_by(func.sum(Transaction.amount).desc()).limit(10)
        results = session.exec(query).all()
        return json.dumps([{"vendor": r[0], "total_amount": float(r[1]), "transaction_count": r[2]} for r in results])

@tool
def get_spending_by_category(config: RunnableConfig, date_from: Optional[str] = None, date_to: Optional[str] = None) -> str:
    """Get a summary of spending grouped by category. Useful for 'What are my top expenses?'"""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        query = select(Category.category_name, func.sum(Transaction.amount).label("total")) \
            .join(Transaction, Transaction.category_id == Category.id) \
            .where(Transaction.user_id == user_id, Transaction.type == "EXPENSE")
        
        if date_from:
            query = query.where(Transaction.date >= datetime.date.fromisoformat(date_from))
        if date_to:
            query = query.where(Transaction.date <= datetime.date.fromisoformat(date_to))
            
        query = query.group_by(Category.category_name).order_by(func.sum(Transaction.amount).desc())
        results = session.exec(query).all()
        return json.dumps([{"category": r[0], "total_amount": float(r[1])} for r in results])

@tool
def get_financial_trends(config: RunnableConfig, months: int = 6) -> str:
    """Get monthly income vs expense totals for trend analysis. 'months' defaults to 6."""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        # Define the month expression based on the database type
        if "sqlite" in str(engine.url):
            month_expr = func.strftime('%Y-%m', Transaction.date)
        else:
            month_expr = func.to_char(Transaction.date, 'YYYY-MM')
            
        query = select(
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            month_expr.label("month")
        ).where(Transaction.user_id == user_id).group_by(Transaction.type, month_expr).order_by(month_expr)
        
        results = session.exec(query).all()
        # Group by month in Python for cleaner output
        trends = {}
        for t_type, amount, month in results:
            if month not in trends:
                trends[month] = {"income": 0, "expense": 0}
            trends[month][t_type.lower()] = float(amount)
            
        return json.dumps(trends)

@tool
def get_transaction_detail(transaction_id: str, config: RunnableConfig) -> str:
    """Get detailed information for a specific transaction by its UUID."""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        try:
            t = get_transaction_by_id(session, UUID(transaction_id), user_id)
            return json.dumps({
                "id": str(t.id),
                "vendor": t.vendor,
                "amount": t.amount,
                "date": str(t.date),
                "notes": t.notes,
                "type": t.type,
                "category_id": str(t.category_id)
            })
        except Exception:
            return "Transaction not found."

@tool
def get_saving_goals(config: RunnableConfig) -> str:
    """Get the user's saving goals and their current progress."""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        state = get_savings_goals_state(session, user_id)
        return json.dumps({
            "goals": [
                {
                    "title": g.title,
                    "target": g.target_amount,
                    "current": g.current_amount,
                    "progress": g.progress_percentage
                } for g in state.goals
            ]
        })

@tool
def search_vector_transactions(query: str, config: RunnableConfig) -> str:
    """Search transactions semantically based on a natural language query."""
    if not settings.GOOGLE_API_KEY:
        return "Vector search is not configured."
        
    user_id = config["configurable"]["user_id"]
    query_vector = embeddings.embed_query(query)
    db = get_sync_mongodb_db()
    collection = db["transactions_vector"]

    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "vector",
                "queryVector": query_vector,
                "numCandidates": 200,
                "limit": 100,
                "filter": {"user_id": str(user_id)}
            }
        },
        {
            "$project": {
                "_id": 0,
                "transaction_id": 1,
                "vendor": 1,
                "notes": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]
    
    try:
        results = list(collection.aggregate(pipeline))
        return json.dumps(results)
    except Exception as e:
        logger.error(f"Vector search tool failed: {e}", exc_info=True)
        return f"TECHNICAL ERROR: Vector search failed. Details: {str(e)}"

@tool
def get_top_spending_days(config: RunnableConfig, date_from: Optional[str] = None, date_to: Optional[str] = None) -> str:
    """Identify the specific days with the highest total spending. Useful for 'When did I spend most?'"""
    user_id = config["configurable"]["user_id"]
    with Session(engine) as session:
        query = select(Transaction.date, func.sum(Transaction.amount).label("total")) \
            .where(Transaction.user_id == user_id, Transaction.type == "EXPENSE")
        
        if date_from:
            query = query.where(Transaction.date >= datetime.date.fromisoformat(date_from))
        if date_to:
            query = query.where(Transaction.date <= datetime.date.fromisoformat(date_to))
            
        query = query.group_by(Transaction.date).order_by(func.sum(Transaction.amount).desc()).limit(5)
        results = session.exec(query).all()
        return json.dumps([{"date": str(r[0]), "total_amount": float(r[1])} for r in results])

# ---------------------------------------------------------------------------
# Insight tools (higher-level summaries built on top of the raw query tools)
# ---------------------------------------------------------------------------

def _month_bounds(d: datetime.date) -> tuple[datetime.date, datetime.date]:
    """Return (first_day, last_day) of the month containing d."""
    first = d.replace(day=1)
    if first.month == 12:
        next_first = first.replace(year=first.year + 1, month=1)
    else:
        next_first = first.replace(month=first.month + 1)
    last = next_first - datetime.timedelta(days=1)
    return first, last

def _prev_month_bounds(d: datetime.date) -> tuple[datetime.date, datetime.date]:
    first_this, _ = _month_bounds(d)
    last_prev = first_this - datetime.timedelta(days=1)
    return _month_bounds(last_prev)

@tool
def get_current_month_overview(config: RunnableConfig) -> str:
    """One-call snapshot of THIS month: income, expense, net, savings rate, and top 3 expense categories.
    Prefer this as the first tool for broad 'how am I doing?' questions."""
    user_id = config["configurable"]["user_id"]
    today = datetime.date.today()
    start, end = _month_bounds(today)

    with Session(engine) as session:
        totals_q = select(Transaction.type, func.sum(Transaction.amount)) \
            .where(Transaction.user_id == user_id,
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Transaction.type)
        totals = {str(t).split(".")[-1].upper(): float(amt or 0) for t, amt in session.exec(totals_q).all()}
        income = totals.get("INCOME", 0.0)
        expense = totals.get("EXPENSE", 0.0)
        net = income - expense
        savings_rate = (net / income * 100) if income > 0 else None

        top_q = select(Category.category_name, func.sum(Transaction.amount).label("total")) \
            .join(Transaction, Transaction.category_id == Category.id) \
            .where(Transaction.user_id == user_id,
                   Transaction.type == "EXPENSE",
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Category.category_name) \
            .order_by(func.sum(Transaction.amount).desc()) \
            .limit(3)
        top = [{"category": r[0], "total_amount": float(r[1])} for r in session.exec(top_q).all()]

    return json.dumps({
        "period": {"from": str(start), "to": str(end)},
        "income": income,
        "expense": expense,
        "net": net,
        "savings_rate_pct": round(savings_rate, 2) if savings_rate is not None else None,
        "top_expense_categories": top,
    })

@tool
def get_budget_vs_actual(config: RunnableConfig, month: Optional[str] = None) -> str:
    """Per-category budget vs actual spend for a month (YYYY-MM, defaults to current month).
    Returns each EXPENSE category's monthly_limit, actual spend, % used, and over_budget flag."""
    user_id = config["configurable"]["user_id"]
    if month:
        try:
            ref = datetime.date.fromisoformat(month + "-01")
        except ValueError:
            return json.dumps({"error": "Invalid month, use YYYY-MM."})
    else:
        ref = datetime.date.today()
    start, end = _month_bounds(ref)

    with Session(engine) as session:
        cats = session.exec(
            select(Category).where(
                Category.user_id == user_id,
                Category.category_type == "expense",
            )
        ).all()

        spend_q = select(Transaction.category_id, func.sum(Transaction.amount)) \
            .where(Transaction.user_id == user_id,
                   Transaction.type == "EXPENSE",
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Transaction.category_id)
        spend_map = {cid: float(amt or 0) for cid, amt in session.exec(spend_q).all()}

        rows = []
        for c in cats:
            actual = spend_map.get(c.id, 0.0)
            limit = c.monthly_limit
            pct = (actual / limit * 100) if limit and limit > 0 else None
            rows.append({
                "category": c.category_name,
                "monthly_limit": limit,
                "actual": actual,
                "pct_used": round(pct, 1) if pct is not None else None,
                "over_budget": bool(limit and actual > limit),
            })

        rows.sort(key=lambda r: (r["pct_used"] is None, -(r["pct_used"] or 0)))

    return json.dumps({"period": {"from": str(start), "to": str(end)}, "categories": rows})

@tool
def get_recurring_expenses(config: RunnableConfig, min_occurrences: int = 3, days: int = 90) -> str:
    """Detect recurring/subscription-like expenses by grouping vendors with >= min_occurrences charges
    in the last `days` days. Returns vendor, count, average amount, and average days between charges."""
    user_id = config["configurable"]["user_id"]
    today = datetime.date.today()
    start = today - datetime.timedelta(days=days)

    with Session(engine) as session:
        rows_q = select(Transaction.vendor, Transaction.amount, Transaction.date) \
            .where(Transaction.user_id == user_id,
                   Transaction.type == "EXPENSE",
                   Transaction.date >= start) \
            .order_by(Transaction.vendor, Transaction.date)
        rows = session.exec(rows_q).all()

    grouped: dict[str, list[tuple[float, datetime.date]]] = {}
    for vendor, amount, dt in rows:
        grouped.setdefault(vendor, []).append((float(amount), dt))

    out = []
    for vendor, items in grouped.items():
        if len(items) < min_occurrences:
            continue
        amounts = [a for a, _ in items]
        dates = sorted([d for _, d in items])
        gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        avg_gap = round(sum(gaps) / len(gaps), 1) if gaps else None
        out.append({
            "vendor": vendor,
            "count": len(items),
            "avg_amount": round(sum(amounts) / len(amounts), 2),
            "total_amount": round(sum(amounts), 2),
            "avg_days_between": avg_gap,
            "first_seen": str(dates[0]),
            "last_seen": str(dates[-1]),
        })

    out.sort(key=lambda r: r["total_amount"], reverse=True)
    return json.dumps({"window_days": days, "min_occurrences": min_occurrences, "recurring": out})

@tool
def compare_periods(config: RunnableConfig, period: str = "month") -> str:
    """Compare current vs previous period totals (period = 'month' or 'week') with per-category deltas.
    Useful for 'am I spending more than last month/week?'."""
    user_id = config["configurable"]["user_id"]
    today = datetime.date.today()

    if period == "week":
        cur_start = today - datetime.timedelta(days=today.weekday())
        cur_end = today
        prev_end = cur_start - datetime.timedelta(days=1)
        prev_start = prev_end - datetime.timedelta(days=6)
    else:
        cur_start, cur_end = _month_bounds(today)
        cur_end = min(cur_end, today)
        prev_start, prev_end = _prev_month_bounds(today)

    def totals(session: Session, start: datetime.date, end: datetime.date) -> dict:
        q = select(Transaction.type, func.sum(Transaction.amount)) \
            .where(Transaction.user_id == user_id,
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Transaction.type)
        return {str(t).split(".")[-1].upper(): float(amt or 0) for t, amt in session.exec(q).all()}

    def by_category(session: Session, start: datetime.date, end: datetime.date) -> dict:
        q = select(Category.category_name, func.sum(Transaction.amount)) \
            .join(Transaction, Transaction.category_id == Category.id) \
            .where(Transaction.user_id == user_id,
                   Transaction.type == "EXPENSE",
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Category.category_name)
        return {name: float(amt or 0) for name, amt in session.exec(q).all()}

    with Session(engine) as session:
        cur_tot = totals(session, cur_start, cur_end)
        prev_tot = totals(session, prev_start, prev_end)
        cur_cat = by_category(session, cur_start, cur_end)
        prev_cat = by_category(session, prev_start, prev_end)

    cats = sorted(set(cur_cat) | set(prev_cat))
    deltas = []
    for c in cats:
        cur_v = cur_cat.get(c, 0.0)
        prev_v = prev_cat.get(c, 0.0)
        diff = cur_v - prev_v
        pct = (diff / prev_v * 100) if prev_v > 0 else None
        deltas.append({
            "category": c,
            "current": cur_v,
            "previous": prev_v,
            "delta": diff,
            "pct_change": round(pct, 1) if pct is not None else None,
        })
    deltas.sort(key=lambda r: abs(r["delta"]), reverse=True)

    return json.dumps({
        "period": period,
        "current": {"from": str(cur_start), "to": str(cur_end), **cur_tot},
        "previous": {"from": str(prev_start), "to": str(prev_end), **prev_tot},
        "category_deltas": deltas[:10],
    })

@tool
def get_savings_goal_projection(config: RunnableConfig) -> str:
    """For each savings goal, project completion based on average monthly contributions and compare to target_date.
    Useful for 'will I hit my goal on time?'."""
    user_id = config["configurable"]["user_id"]
    today = datetime.date.today()

    with Session(engine) as session:
        goals = session.exec(
            select(SavingsGoal).where(SavingsGoal.user_id == user_id)
        ).all()
        contribs = session.exec(
            select(GoalContribution).where(GoalContribution.user_id == user_id)
        ).all()

    by_goal: dict = {}
    for c in contribs:
        by_goal.setdefault(c.goal_id, []).append(c)

    out = []
    for g in goals:
        cs = by_goal.get(g.id, [])
        contributed = sum(float(c.amount) for c in cs)
        current = float(g.initial_amount or 0) + contributed
        remaining = max(0.0, float(g.target_amount) - current)
        progress_pct = (current / g.target_amount * 100) if g.target_amount else 0.0

        if cs:
            try:
                contrib_dates = [datetime.date.fromisoformat(c.date) for c in cs]
                first = min(contrib_dates)
                months_active = max(1, (today.year - first.year) * 12 + (today.month - first.month) + 1)
                avg_monthly = contributed / months_active
            except Exception:
                avg_monthly = 0.0
        else:
            avg_monthly = 0.0

        if avg_monthly > 0 and remaining > 0:
            months_needed = remaining / avg_monthly
            eta = today + datetime.timedelta(days=int(months_needed * 30))
            eta_str = str(eta)
        elif remaining <= 0:
            eta_str = "completed"
        else:
            eta_str = None

        on_track = None
        if g.target_date and eta_str and eta_str != "completed":
            try:
                target = datetime.date.fromisoformat(g.target_date)
                on_track = eta <= target
            except Exception:
                on_track = None

        out.append({
            "title": g.title,
            "target_amount": float(g.target_amount),
            "current_amount": round(current, 2),
            "remaining": round(remaining, 2),
            "progress_pct": round(progress_pct, 1),
            "avg_monthly_contribution": round(avg_monthly, 2),
            "projected_completion": eta_str,
            "target_date": g.target_date,
            "on_track": on_track,
        })

    return json.dumps({"goals": out})

@tool
def get_available_balance(config: RunnableConfig) -> str:
    """User's remaining spendable balance this month: manual_available_amount minus this-month net expenses (expenses - income)."""
    user_id = config["configurable"]["user_id"]
    today = datetime.date.today()
    start, end = _month_bounds(today)

    with Session(engine) as session:
        bs = session.exec(
            select(UserBudgetSettings).where(UserBudgetSettings.user_id == user_id)
        ).first()
        starting = float(bs.manual_available_amount) if bs else 0.0

        q = select(Transaction.type, func.sum(Transaction.amount)) \
            .where(Transaction.user_id == user_id,
                   Transaction.date >= start,
                   Transaction.date <= end) \
            .group_by(Transaction.type)
        totals = {str(t).split(".")[-1].upper(): float(amt or 0) for t, amt in session.exec(q).all()}

    income = totals.get("INCOME", 0.0)
    expense = totals.get("EXPENSE", 0.0)
    net_outflow = expense - income
    remaining = starting - net_outflow

    return json.dumps({
        "period": {"from": str(start), "to": str(end)},
        "manual_available_amount": starting,
        "month_to_date_income": income,
        "month_to_date_expense": expense,
        "net_outflow": net_outflow,
        "remaining": round(remaining, 2),
    })

# ---------------------------------------------------------------------------
# Global Agent Initialization
# ---------------------------------------------------------------------------

GLOBAL_TOOLS = [
    get_current_month_overview,
    get_available_balance,
    get_budget_vs_actual,
    compare_periods,
    get_recurring_expenses,
    get_savings_goal_projection,
    get_categories,
    filter_transactions,
    get_spending_by_vendor,
    get_spending_by_category,
    get_top_spending_days,
    get_financial_trends,
    get_transaction_detail,
    get_saving_goals,
    search_vector_transactions,
]

SYSTEM_PROMPT = """You are "BudgetMate Coach", a proactive, numerate, and encouraging personal-finance
assistant inside the BudgetMate app. You speak briefly, back every claim with numbers from
the user's real data (via tools), and you always finish with at least one concrete insight
or next-step suggestion - never just a data dump.

================================================================================
REASONING PLAYBOOK (think silently, do NOT reveal these steps)
================================================================================
1. Classify the user's intent into one of:
   - lookup     -> "show me X" (specific transactions, a goal, a category)
   - summary    -> "how much / where / when did I ..." (aggregations)
   - insight    -> "am I doing ok?", "what should I cut?", "trends"
   - advice     -> "how can I save for X?", "is this affordable?"
   - action     -> the user wants to change something (politely note that
                   actions like edits/deletes must be done in the UI; you are
                   read-only).
2. Pick the SMALLEST set of tools that answers the question. Prefer:
   - `get_current_month_overview` as a single first call when the user asks a
     broad "how am I doing" question - it bundles income, expense, net, savings
     rate and top categories.
   - aggregation tools (`get_spending_by_*`, `get_financial_trends`,
     `compare_periods`, `get_budget_vs_actual`) over `filter_transactions`
     for "how much / where / trends" questions.
   - `filter_transactions` ONLY for precise lookups (e.g. "transactions over
     500k in October").
   - `search_vector_transactions` for fuzzy / semantic queries
     (e.g. "where did I buy coffee?", "anything that looks like a subscription?").
3. Ground every number in tool output. If a tool returns empty, say so
   explicitly ("No data for that period yet.") and suggest a reasonable
   next step instead of guessing.
4. After the raw numbers, add 1-3 concrete insights:
   - percent shares ("Food is 38% of spend"),
   - month-over-month or week-over-week deltas ("up 12% vs last month"),
   - budget breaches ("Dining is at 112% of its 2,000,000 VND limit"),
   - goal projections ("at this pace you will miss 'Laptop' by ~3 weeks"),
   - 1 actionable suggestion when relevant.
5. Clarify at most ONCE, and only when the answer would change materially
   (e.g. ambiguous time range AND the user has >6 months of data).

================================================================================
TOOL CHEATSHEET (use the right tool, in this order of preference)
================================================================================
- get_current_month_overview .... broad "how am I doing this month?" snapshot.
- get_available_balance ......... "how much can I still spend?" / cash left.
- get_budget_vs_actual .......... "am I within budget?" per-category limits.
- compare_periods ............... "am I spending more than last month/week?".
- get_spending_by_category ...... "what are my top expense categories?".
- get_spending_by_vendor ........ "where do I spend most?" by merchant.
- get_top_spending_days ......... "when did I spend most?" by date.
- get_financial_trends .......... multi-month income vs expense trend.
- get_recurring_expenses ........ subscriptions / recurring vendor detection.
- get_savings_goal_projection ... "will I hit my goal on time?".
- get_saving_goals .............. simple list of goals + progress.
- get_categories ................ when you need category names/ids/types.
- filter_transactions ........... precise transaction lookups (dates, amounts).
- get_transaction_detail ........ one specific transaction by id.
- search_vector_transactions .... semantic / fuzzy text search.

================================================================================
LOCALE & FORMATTING
================================================================================
- Currency: Vietnamese Dong. Format with comma thousands and the suffix " VND"
  (e.g. 1,250,000 VND). No decimals for amounts >= 1,000. Two decimals only
  when the amount is < 1,000 AND it is a percentage/rate.
- Percentages: integer when >= 10% (e.g. 38%), one decimal when < 10% (e.g. 4.2%).
- Dates: use the injected `Current Date` context. Map relative phrases as:
    "today"      -> current_date
    "yesterday"  -> current_date - 1d
    "this week"  -> Monday..current_date
    "this month" -> first day of current month..current_date
    "last month" -> previous calendar month, full
    "this year"  -> Jan 1..current_date
- Never invent data, vendor names, or category names. If a value is missing,
  say "not recorded" and move on.

================================================================================
OUTPUT FORMAT (STRICT - the frontend renders your reply as raw HTML)
================================================================================
- Reply with an HTML body fragment ONLY. No <html>, <head>, <body>.
- NO markdown. NO triple backticks. NO "```html" fences. Just HTML tags.
- Use INLINE `style="..."` attributes for ALL styling. Do NOT use `class=`.
- Allowed tags ONLY:
  <div> <h3> <h4> <p> <ul> <ol> <li> <strong> <em> <br>
  <table> <thead> <tbody> <tr> <th> <td> <span> <small> <hr>

- Allowed CSS properties inside `style=` ONLY (anything else: do not use):
  color, background, background-color, padding, margin, margin-top,
  margin-bottom, border, border-left, border-bottom, border-radius,
  border-collapse, font-weight, font-size, text-align, text-transform,
  letter-spacing, line-height, width, max-width, font-variant-numeric.

- Color palette (pick ONLY from these hex values - never invent new shades):
  * Text default ........ #1f2937   (gray-800)
  * Text muted .......... #6b7280   (gray-500)
  * Text strong ......... #111827   (gray-900)
  * Border / divider .... #e5e7eb   (gray-200)
  * Soft background ..... #f9fafb   (gray-50)
  * Header background ... #f3f4f6   (gray-100)
  * Positive / saving ... #16a34a   (green-600)
  * Negative / overspend  #dc2626   (red-600)
  * Warning / near limit  #d97706   (amber-600)
  * Accent / insight .... #2563eb   (blue-600)
  * Insight bg .......... #eff6ff   (blue-50)

- Required style patterns (copy these, change only the text content):

  * Root wrapper (use ONCE around the whole reply):
    <div style="font-size:14px;line-height:1.55;color:#1f2937">
      ...content...
    </div>

  * Headings:
    <h4 style="margin:0 0 6px 0;font-size:15px;font-weight:600;color:#111827">...</h4>
    <h3 style="margin:0 0 8px 0;font-size:17px;font-weight:700;color:#111827">...</h3>

  * Paragraph:
    <p style="margin:0 0 8px 0">...</p>

  * Lists:
    <ul style="margin:0 0 8px 18px;padding:0">
      <li style="margin:2px 0">...</li>
    </ul>

  * Tables (use this exact shape; right-align numeric columns):
    <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px">
      <thead>
        <tr style="background:#f3f4f6;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;font-size:11px">
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb">Category</th>
          <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">Food</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;font-weight:500">800,000 VND</td>
        </tr>
      </tbody>
    </table>

  * Closing takeaway block (use ONCE at the end, instead of <hr>):
    Write the takeaway as a natural sentence. Do NOT prefix it with a label
    like "Insight:", "Tip:", "Note:", "Summary:" or any similar word.
    <div style="margin-top:10px;padding:8px 12px;background:#eff6ff;border-left:3px solid #2563eb;border-radius:4px">
      Your natural-language takeaway sentence goes here.
    </div>

  * Key metric "card" (only when the answer is one big headline number):
    <div style="background:#f9fafb;padding:10px 14px;border-radius:6px;margin:6px 0">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Label</div>
      <div style="font-size:22px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums">1,250,000 VND</div>
    </div>

  * Color semantics (wrap the value, NOT a whole sentence):
    - Positive / on-track / under budget / saving:
      <span style="color:#16a34a;font-weight:600">...</span>
    - Negative / over budget / overspend / off-track:
      <span style="color:#dc2626;font-weight:600">...</span>
    - Warning / approaching limit (>=80% used):
      <span style="color:#d97706;font-weight:600">...</span>
    - Neutral emphasis on the main number:
      <strong>...</strong>

  * Footnote / small text:
    <small style="color:#6b7280;font-size:12px">...</small>

- Length: keep the whole reply under ~2000 characters unless the user
  explicitly asks for a "detailed" or "full" breakdown.
- FORBIDDEN: `class=` attributes, <script>, <style>, <iframe>, <img>, <a href>,
  inline event handlers (onclick, onerror, onload, ...), any javascript: URIs,
  CSS properties not on the allowlist above (no position, no z-index, no
  transform, no animation, no flex, no grid, no @media, no calc(), no var()).
- Start the reply directly with the root <div> wrapper. Do NOT prefix with
  any commentary, language tag, or whitespace.

================================================================================
GOOD ANSWER SHAPE (template, adapt to the question)
================================================================================
<div style="font-size:14px;line-height:1.55;color:#1f2937">
  <h4 style="margin:0 0 6px 0;font-size:15px;font-weight:600;color:#111827">Headline answer in one short sentence</h4>
  <p style="margin:0 0 8px 0">Supporting line with the headline number in <strong>1,250,000 VND</strong>.</p>

  <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px">
    <thead>
      <tr style="background:#f3f4f6;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;font-size:11px">
        <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb">Category</th>
        <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">Food</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;font-weight:500">800,000 VND</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:10px;padding:8px 12px;background:#eff6ff;border-left:3px solid #2563eb;border-radius:4px">
    Food is <span style="color:#d97706;font-weight:600">38%</span> of spend, up <span style="color:#dc2626;font-weight:600">12%</span> vs last month. Try capping dining at 600,000 VND next week.
  </div>
</div>
"""

# 1. Create the Prompt Template
prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

# 2. Create the Agent
base_agent = create_agent(
    model=llm,
    tools=GLOBAL_TOOLS,
    system_prompt=SYSTEM_PROMPT
)

def get_chat_history(session_id: str):
    """Return a MongoDB-backed chat message history."""
    return MongoDBChatMessageHistory(
        connection_string=settings.MONGODB_URL,
        session_id=session_id,
        database_name=settings.MONGODB_DB_NAME,
        collection_name="chat_history"
    )

from langchain_core.messages import SystemMessage

# 3. Format input for agent
def format_agent_input(data):
    formatted_prompt = prompt_template.format_messages(
        input=data["input"],
        chat_history=data.get("chat_history", [])
    )
    
    context_msg = SystemMessage(content=f"Context: User ID {data.get('user_id', 'Unknown')}, Current Date {data.get('current_date', 'Unknown')}")
    formatted_prompt.insert(1, context_msg)
    
    return {"messages": formatted_prompt}

formatted_agent = RunnableLambda(format_agent_input) | base_agent

# 4. Wrap with persistent history
agent_with_history = RunnableWithMessageHistory(
    formatted_agent,
    get_chat_history,
    input_messages_key="input",
    history_messages_key="chat_history",
)

# ---------------------------------------------------------------------------
# Optimized Runner
# ---------------------------------------------------------------------------

def _clean_html_response(text: str) -> str:
    """Defensively strip stray markdown code fences and whitespace.
    The model is instructed to return raw HTML, but occasionally wraps it in
    ```html ... ``` despite the prompt. We do NOT sanitize tags - safety is
    enforced at the prompt level (see SYSTEM_PROMPT OUTPUT FORMAT block).
    """
    if not text:
        return text
    s = text.strip()
    if s.startswith("```"):
        first_nl = s.find("\n")
        if first_nl != -1:
            s = s[first_nl + 1:]
        else:
            s = s.lstrip("`")
    if s.endswith("```"):
        s = s[: -3]
    return s.strip()

async def run_chatbot_agent(
    user_input: str,
    user_id: UUID,
    session: Session,
    session_id: str
) -> str:
    """Highly optimized: Only triggers execution logic. Everything else is pre-compiled."""
    
    result = await agent_with_history.ainvoke(
        {
            "input": user_input,
            "user_id": str(user_id),
            "current_date": datetime.date.today().isoformat()
        },
        config={
            "configurable": {
                "session_id": session_id,
                "user_id": user_id
            }
        }
    )

    if isinstance(result, dict):
        messages = result.get("messages", [])
        if messages:
            last_msg = messages[-1]
            content = getattr(last_msg, "content", str(last_msg))

            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and "text" in part:
                        text_parts.append(part["text"])
                    elif isinstance(part, str):
                        text_parts.append(part)
                return _clean_html_response("".join(text_parts))

            return _clean_html_response(str(content))

    return _clean_html_response(str(result))
