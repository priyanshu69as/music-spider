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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://music-spider.vercel.app",
        "https://music-spider-ozc6d6v3h-chikuu1.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# CORS
# =========================================================



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




import os
import requests

from fastapi import HTTPException, Query

@app.get("/youtube/search")
def search_youtube(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=25),
):
    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="YouTube API key is not configured",
        )

    try:
        response = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": q,
                "type": "video",
                "videoEmbeddable": "true",
                "maxResults": limit,
                "regionCode": "IN",
                "relevanceLanguage": "hi",
                "key": api_key,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="YouTube search failed",
        )

    return [
        {
            "video_id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
        }
        for item in data.get("items", [])
        if item.get("id", {}).get("videoId")
    ]    
