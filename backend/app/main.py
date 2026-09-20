from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.routes.songs import router as songs_router
from app.routes.music import router as music_router
from app.database.connection import engine
from app.routes.history import router as history_router
from app.routes.likes import router as likes_router


# =========================================================
# CREATE APP
# =========================================================

app = FastAPI(
    title="Music Recommendation API",
    description="Backend API for the Music Recommendation Platform",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(songs_router)

app.include_router(music_router)

app.include_router(history_router)

app.include_router(likes_router)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Music Recommendation API is running 🎵",
        "status": "success"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =========================================================
# DATABASE TEST
# =========================================================

@app.get("/database-test")
def database_test():

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("SELECT 1")
            )

            result.fetchone()

        return {
            "status": "success",
            "database": "connected"
        }

    except Exception as e:

        return {
            "status": "error",
            "database": "not connected",
            "details": str(e)
        }