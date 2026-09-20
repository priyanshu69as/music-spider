from fastapi.responses import RedirectResponse
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


@router.get("/stream/{track_id}")
def stream_music(track_id: str):
    try:
        stream_url = f"https://api.audius.co/v1/tracks/{track_id}/stream"

        return RedirectResponse(
            url=stream_url,
            status_code=307
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )    