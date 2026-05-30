from collections import defaultdict, deque
import time
from pathlib import Path

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.database import init_databases, close_databases
from app.routes import finance_router, router as auth_router


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

rate_buckets: dict[str, deque[float]] = defaultdict(deque)
SENSITIVE_ROUTE_PREFIXES = (
    "/auth/login",
    "/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/users/password",
    "/api/v1/users/profile-photo",
    "/api/v1/users/me",
)

configured_origins = [
    origin.strip() for origin in settings.cors_origin.split(",") if origin.strip() and origin.strip() != "*"
]
dev_origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]
origins = sorted({*configured_origins, *dev_origins})

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(settings.upload_dir)
if not uploads_dir.is_absolute():
    uploads_dir = Path(__file__).resolve().parents[1] / uploads_dir
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

api = APIRouter(prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"ok": True, "service": "budgetmate-api"}


@app.middleware("http")
async def rate_limit_sensitive_routes(request: Request, call_next):
    if not settings.rate_limit_enabled:
        return await call_next(request)

    if request.method in {"POST", "PUT", "PATCH"} and request.url.path.startswith(SENSITIVE_ROUTE_PREFIXES):
        client_host = request.client.host if request.client else "unknown"
        key = f"{client_host}:{request.url.path}"
        now = time.monotonic()
        bucket = rate_buckets[key]
        window = settings.rate_limit_sensitive_window_seconds
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= settings.rate_limit_sensitive_requests:
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again shortly."})
        bucket.append(now)

    return await call_next(request)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"loc": error.get("loc", []), "msg": error.get("msg", "Invalid value")}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=400, content={"detail": "Invalid request data", "errors": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled API error on {request.method} {request.url.path}: {exc.__class__.__name__}")
    return JSONResponse(status_code=500, content={"detail": "Unexpected server error"})


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
app.include_router(auth_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(api)
