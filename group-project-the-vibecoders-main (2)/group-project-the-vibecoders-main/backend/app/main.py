from app.core.mongodb import init_vector_index
from contextlib import asynccontextmanager

from sqlmodel import Session
from seed.seed_data import seed_initial_data
from fastapi import FastAPI
from sqlmodel import SQLModel
from app.core.database import engine
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.mongodb import mongodb
from fastapi.middleware.cors import CORSMiddleware


from app.core.mongodb import mongodb

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set LangChain environment variables for automatic tracing
    import os
    if settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT

    SQLModel.metadata.create_all(engine)
    
    # Connect MongoDB and initialize Vector Search index
    mongodb.connect()
    init_vector_index()
    
    # Seed initial data
    with Session(engine) as session:
        seed_initial_data(session)
            
    yield
    
    # Close MongoDB
    mongodb.close()

from fastapi_pagination import add_pagination
from app.shared.exception.handlers import add_global_exception_handlers

app = FastAPI(title="App", lifespan=lifespan)
add_pagination(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
add_global_exception_handlers(app)

app.include_router(api_router, prefix="/api/v1")
