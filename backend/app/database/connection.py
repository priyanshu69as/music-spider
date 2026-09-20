import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Load environment variables
load_dotenv()


# PostgreSQL connection URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. "
        "Check your .env file."
    )


# Create database engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# Database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for SQLAlchemy models
Base = declarative_base()


# FastAPI database dependency
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
