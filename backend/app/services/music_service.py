import requests


AUDIUS_BASE_URL = "https://api.audius.co/v1"


def search_tracks(query: str, limit: int = 10):

    response = requests.get(
        f"{AUDIUS_BASE_URL}/tracks/search",
        params={
            "query": query,
            "limit": limit
        },
        timeout=10
    )

    response.raise_for_status()

    return response.json()

from fastapi import APIRouter, HTTPException, Query

from app.services.music_service import search_tracks


router = APIRouter(
    prefix="/music",
    tags=["Music"]
)


@router.get("/search")
def search_music(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20)
):

    try:

        result = search_tracks(q, limit)

        tracks = result.get("data", [])

        return {
            "query": q,
            "count": len(tracks),
            "tracks": tracks
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )