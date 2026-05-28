from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.database import init_databases, close_databases
from app.routes import router as auth_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_databases()
    yield
    # Shutdown
    await close_databases()


app = FastAPI(
    title="BudgetMate API",
    version="1.0.0",
    lifespan=lifespan
)

origins = ["*"] if settings.cors_origin == "*" else [
    origin.strip() for origin in settings.cors_origin.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"ok": True, "service": "budgetmate-api"}


@api.get("/profile")
def profile() -> dict[str, str]:
    return {
        "brand_name": "BudgetMate",
        "tagline": "Smart Financial Management",
        "owner_name": "demo_user",
        "status": "FastAPI ready",
    }


@api.get("/projects")
def projects() -> list[dict[str, object]]:
    return [
        {
            "id": 1,
            "title": "Dashboard Intelligence",
            "subtitle": "Cash flow at a glance",
            "description": "Tracks total balance, spending, income, recent transactions, insights, goals, and budget health.",
            "accent": "#2563eb",
            "link_url": "http://54.179.178.52/dashboard",
            "link_label": "Open dashboard",
            "stats": [{"label": "Balance", "value": "164.149.000 ₫"}, {"label": "Transactions", "value": "14"}],
        }
    ]


@api.get("/skills")
def skills() -> list[dict[str, object]]:
    return [
        {"id": 1, "name": "Budget tracking", "category": "Finance", "level": 94, "description": "Monthly pools, category activity, balances, income, and expenses."},
        {"id": 2, "name": "Cash flow forecasting", "category": "Analytics", "level": 88, "description": "End-of-month projections from recurring transaction patterns."},
    ]


@api.get("/education")
def education() -> list[dict[str, object]]:
    return [
        {
            "id": 1,
            "title": "Financial Dashboard System",
            "institution": "BudgetMate Product Lab",
            "period": "2026",
            "description": "Finance workflows, chart reading, category planning, and dashboard decisions.",
            "highlights": ["Cash flow reports", "Savings goals", "Budget health scoring"],
        }
    ]


@api.get("/leadership")
def leadership() -> list[dict[str, object]]:
    return [
        {
            "id": 1,
            "title": "Personal Finance Command Center",
            "organization": "BudgetMate",
            "period": "2026",
            "description": "Turns scattered spending records into one calm, actionable financial view.",
            "impact": ["Healthy cash flow score of 100", "7.330.000 ₫ savings trajectory", "14 transactions organized"],
        }
    ]


@api.post("/contact", status_code=201)
def contact() -> dict[str, str]:
    return {"message": "Message received"}


app.include_router(auth_router)
app.include_router(api)
